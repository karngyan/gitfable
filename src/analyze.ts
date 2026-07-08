import type { Commit, Era, Hero, Records, RepoStats, Trait } from './types.js'

const DAY_MS = 86_400_000

const STOPWORDS = new Set([
  'this', 'that', 'with', 'from', 'into', 'onto', 'over', 'when', 'only', 'also',
  'just', 'more', 'some', 'very', 'make', 'made', 'makes', 'adds', 'added',
  'remove', 'removed', 'removes', 'update', 'updated', 'updates', 'merge',
  'merged', 'branch', 'pull', 'request', 'master', 'main', 'commit', 'commits',
  'initial', 'readme', 'file', 'files', 'bump', 'version', 'minor', 'patch',
  'chore', 'feat', 'docs', 'test', 'tests', 'refactor', 'style', 'build',
  'change', 'changed', 'changes', 'again', 'work', 'stuff', 'their', 'there',
  'have', 'been', 'will', 'using', 'use', 'add', 'fix', 'fixes', 'fixed',
])

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function mode(counts: Map<string, number>): string | null {
  let best: string | null = null
  let bestN = 0
  for (const [k, n] of counts) {
    if (n > bestN) {
      best = k
      bestN = n
    }
  }
  return best
}

function trait(h: Omit<Hero, 'trait'>, rank: number): Trait {
  if (h.nightCommits >= 3 && h.nightCommits / h.commits >= 0.25) return 'nightowl'
  if (h.weekendCommits >= 3 && h.weekendCommits / h.commits >= 0.4) return 'weekender'
  if (h.deletions > h.additions) return 'reaper'
  if (rank === 0) return 'prolific'
  return 'builder'
}

function buildHeroes(commits: Commit[]): Hero[] {
  const byAuthor = new Map<string, Omit<Hero, 'trait'>>()
  for (const c of commits) {
    const h = byAuthor.get(c.author) ?? {
      name: c.author,
      commits: 0,
      additions: 0,
      deletions: 0,
      nightCommits: 0,
      weekendCommits: 0,
    }
    h.commits++
    h.additions += c.additions
    h.deletions += c.deletions
    if (c.hourLocal < 6) h.nightCommits++
    if (c.dayLocal === 0 || c.dayLocal === 6) h.weekendCommits++
    byAuthor.set(c.author, h)
  }
  return [...byAuthor.values()]
    .sort((a, b) => b.commits - a.commits || a.name.localeCompare(b.name))
    .slice(0, 5)
    .map((h, i) => ({ ...h, trait: trait(h, i) }))
}

function buildEras(sorted: Commit[]): Era[] {
  const count = Math.min(4, Math.max(1, Math.floor(sorted.length / 8)))
  const size = Math.ceil(sorted.length / count)
  const eras: Era[] = []
  for (let i = 0; i < sorted.length; i += size) {
    const chunk = sorted.slice(i, i + size)
    const authors = new Map<string, number>()
    const files = new Map<string, number>()
    for (const c of chunk) {
      authors.set(c.author, (authors.get(c.author) ?? 0) + 1)
      for (const f of c.files) files.set(f.path, (files.get(f.path) ?? 0) + 1)
    }
    eras.push({
      start: chunk[0]!.date,
      end: chunk[chunk.length - 1]!.date,
      commits: chunk.length,
      topAuthor: mode(authors)!,
      topFile: mode(files),
    })
  }
  return eras
}

function buildRecords(sorted: Commit[]): Records {
  let biggest: Records['biggestCommit'] = null
  let reverts = 0
  let merges = 0
  let fixes = 0
  let nightCommits = 0
  let shortest: string | null = null
  const words = new Map<string, number>()
  const days = new Map<string, number>()

  for (const c of sorted) {
    const size = c.additions + c.deletions
    if (size > 0 && (biggest === null || size > biggest.size)) {
      biggest = { hash: c.hash, message: c.message, author: c.author, size }
    }
    if (/^revert/i.test(c.message)) reverts++
    if (/^merge/i.test(c.message)) merges++
    else if (/\bfix(es|ed)?\b/i.test(c.message)) fixes++
    if (c.hourLocal < 6) nightCommits++
    if (c.message.trim() && (shortest === null || c.message.length < shortest.length)) {
      shortest = c.message
    }
    days.set(dayKey(c.date), (days.get(dayKey(c.date)) ?? 0) + 1)
    for (const w of c.message.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/)) {
      if (w.length >= 4 && !STOPWORDS.has(w)) words.set(w, (words.get(w) ?? 0) + 1)
    }
  }

  let longestGapDays = 0
  for (let i = 1; i < sorted.length; i++) {
    const gap = Math.floor((sorted[i]!.date.getTime() - sorted[i - 1]!.date.getTime()) / DAY_MS)
    if (gap > longestGapDays) longestGapDays = gap
  }

  const uniqueDays = [...days.keys()].sort()
  let longestStreakDays = uniqueDays.length > 0 ? 1 : 0
  let streak = 1
  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1]! + 'T00:00:00Z').getTime()
    const cur = new Date(uniqueDays[i]! + 'T00:00:00Z').getTime()
    streak = cur - prev === DAY_MS ? streak + 1 : 1
    if (streak > longestStreakDays) longestStreakDays = streak
  }

  const busiest = mode(days)
  const favorite = mode(words)

  return {
    biggestCommit: biggest,
    longestGapDays,
    longestStreakDays,
    busiestDay: busiest ? { date: busiest, commits: days.get(busiest)! } : null,
    reverts,
    merges,
    fixes,
    nightCommits,
    shortestMessage: shortest,
    favoriteWord: favorite && words.get(favorite)! >= 3 ? favorite : null,
  }
}

export function analyze(name: string, commits: Commit[]): RepoStats {
  if (commits.length === 0) throw new Error('cannot analyze an empty history')
  const sorted = [...commits].sort((a, b) => a.date.getTime() - b.date.getTime())
  const first = sorted[0]!
  const last = sorted[sorted.length - 1]!

  const fileChanges = new Map<string, number>()
  for (const c of sorted) {
    for (const f of c.files) {
      fileChanges.set(f.path, (fileChanges.get(f.path) ?? 0) + f.additions + f.deletions)
    }
  }
  const topFiles = [...fileChanges.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([path, changes]) => ({ path, changes }))

  return {
    name,
    firstDate: first.date,
    lastDate: last.date,
    spanDays: Math.round((last.date.getTime() - first.date.getTime()) / DAY_MS),
    totalCommits: sorted.length,
    totalAdditions: sorted.reduce((n, c) => n + c.additions, 0),
    totalDeletions: sorted.reduce((n, c) => n + c.deletions, 0),
    heroes: buildHeroes(sorted),
    eras: buildEras(sorted),
    topFiles,
    records: buildRecords(sorted),
  }
}
