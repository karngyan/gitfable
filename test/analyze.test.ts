import { describe, expect, it } from 'vitest'
import { analyze } from '../src/analyze.js'
import type { Commit } from '../src/types.js'

let hashCounter = 0

function mk(over: Partial<Commit> & { iso: string }): Commit {
  const { iso, ...rest } = over
  const date = new Date(iso)
  const localIso = iso.slice(0, 19)
  const asUtc = new Date(localIso + 'Z')
  return {
    hash: `hash${hashCounter++}`,
    author: 'Karn',
    email: 'mail@karngyan.com',
    date,
    message: 'work on the engine',
    additions: 10,
    deletions: 2,
    files: [{ path: 'src/engine.ts', additions: 10, deletions: 2 }],
    hourLocal: asUtc.getUTCHours(),
    dayLocal: asUtc.getUTCDay(),
    ...rest,
  }
}

describe('analyze', () => {
  it('ranks heroes by commit count', () => {
    const commits = [
      mk({ iso: '2026-01-01T10:00:00+00:00', author: 'Ada' }),
      mk({ iso: '2026-01-02T10:00:00+00:00', author: 'Karn' }),
      mk({ iso: '2026-01-03T10:00:00+00:00', author: 'Karn' }),
      mk({ iso: '2026-01-04T10:00:00+00:00', author: 'Karn' }),
      mk({ iso: '2026-01-05T10:00:00+00:00', author: 'Ada' }),
    ]
    const stats = analyze('demo', commits)
    expect(stats.heroes[0]!.name).toBe('Karn')
    expect(stats.heroes[0]!.commits).toBe(3)
    expect(stats.heroes[1]!.name).toBe('Ada')
  })

  it('computes span and totals', () => {
    const commits = [
      mk({ iso: '2026-01-01T10:00:00+00:00' }),
      mk({ iso: '2026-01-11T10:00:00+00:00' }),
    ]
    const stats = analyze('demo', commits)
    expect(stats.totalCommits).toBe(2)
    expect(stats.spanDays).toBe(10)
    expect(stats.totalAdditions).toBe(20)
    expect(stats.totalDeletions).toBe(4)
  })

  it('finds the longest gap and streak', () => {
    const commits = [
      mk({ iso: '2026-01-01T10:00:00+00:00' }),
      mk({ iso: '2026-01-02T10:00:00+00:00' }),
      mk({ iso: '2026-01-03T10:00:00+00:00' }),
      mk({ iso: '2026-02-20T10:00:00+00:00' }),
    ]
    const stats = analyze('demo', commits)
    expect(stats.records.longestStreakDays).toBe(3)
    expect(stats.records.longestGapDays).toBe(48)
  })

  it('counts reverts, fixes, merges, and night commits', () => {
    const commits = [
      mk({ iso: '2026-01-01T03:00:00+00:00', message: 'Revert "bad idea"' }),
      mk({ iso: '2026-01-02T10:00:00+00:00', message: 'fix: the bad idea properly' }),
      mk({ iso: '2026-01-03T10:00:00+00:00', message: 'Merge pull request #7' }),
      mk({ iso: '2026-01-04T02:30:00+00:00', message: 'late night refactor' }),
    ]
    const stats = analyze('demo', commits)
    expect(stats.records.reverts).toBe(1)
    expect(stats.records.fixes).toBe(1)
    expect(stats.records.merges).toBe(1)
    expect(stats.records.nightCommits).toBe(2)
  })

  it('crowns the biggest commit', () => {
    const commits = [
      mk({ iso: '2026-01-01T10:00:00+00:00', additions: 5, deletions: 1 }),
      mk({
        iso: '2026-01-02T10:00:00+00:00',
        message: 'the big rewrite',
        additions: 900,
        deletions: 400,
      }),
    ]
    const stats = analyze('demo', commits)
    expect(stats.records.biggestCommit!.message).toBe('the big rewrite')
    expect(stats.records.biggestCommit!.size).toBe(1300)
  })

  it('finds a favorite word, ignoring stopwords', () => {
    const commits = [
      mk({ iso: '2026-01-01T10:00:00+00:00', message: 'polish the dashboard' }),
      mk({ iso: '2026-01-02T10:00:00+00:00', message: 'more dashboard polish' }),
      mk({ iso: '2026-01-03T10:00:00+00:00', message: 'dashboard tweaks again' }),
      mk({ iso: '2026-01-04T10:00:00+00:00', message: 'update readme' }),
    ]
    const stats = analyze('demo', commits)
    expect(stats.records.favoriteWord).toBe('dashboard')
  })

  it('chunks history into at most four eras', () => {
    const commits = Array.from({ length: 100 }, (_, i) =>
      mk({ iso: `2025-0${(i % 9) + 1}-0${(i % 9) + 1}T10:00:00+00:00` }),
    )
    const stats = analyze('demo', commits)
    expect(stats.eras.length).toBeGreaterThanOrEqual(1)
    expect(stats.eras.length).toBeLessThanOrEqual(4)
    expect(stats.eras.reduce((n, e) => n + e.commits, 0)).toBe(100)
  })

  it('handles a single commit repo', () => {
    const stats = analyze('tiny', [mk({ iso: '2026-01-01T10:00:00+00:00' })])
    expect(stats.totalCommits).toBe(1)
    expect(stats.eras).toHaveLength(1)
    expect(stats.heroes).toHaveLength(1)
    expect(stats.records.longestGapDays).toBe(0)
  })
})
