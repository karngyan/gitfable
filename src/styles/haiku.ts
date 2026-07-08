import type { Palette } from '../color.js'
import { pick, type Rng } from '../rng.js'
import type { RepoStats } from '../types.js'

/**
 * Heuristic syllable counter: vowel groups, minus a trailing silent 'e'.
 * It disagrees with English sometimes, but it is the single source of truth
 * for both generation and verification, so every haiku is 5-7-5 by law.
 */
export function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '')
  if (w.length === 0) return 0
  const groups = w.match(/[aeiouy]+/g)?.length ?? 0
  if (groups === 0) return 1
  if (groups > 1 && w.endsWith('e') && !w.endsWith('le')) return groups - 1
  return groups
}

export function lineSyllables(line: string): number {
  return line
    .trim()
    .split(/\s+/)
    .reduce((n, w) => n + syllables(w), 0)
}

const ORIGINS = [
  'dawn', 'first', 'green', 'seed', 'spring', 'branch', 'roots', 'clean', 'new',
  'morning', 'garden', 'empty', 'begins', 'open', 'readme', 'clone', 'sprouts',
] as const

const TOIL = [
  'night', 'bugs', 'tests', 'fails', 'red', 'deep', 'builds', 'breaks', 'logs',
  'midnight', 'cursor', 'blinking', 'coffee', 'broken', 'reverts', 'silence',
  'terminal', 'rewrites', 'stack trace', 'debugging',
] as const

const PRESENT = [
  'moss', 'moon', 'still', 'grows', 'waits', 'drifts', 'slow', 'old', 'code', 'cold',
  'glow', 'snow', 'ember', 'evening', 'autumn', 'winter', 'commits', 'shadow',
  'unfinished', 'quiet', 'settles', 'listens',
] as const

function fillLine(rng: Rng, target: number, pool: readonly string[], opening?: string): string {
  const words: string[] = []
  let rem = target
  if (opening && opening.length > 0) {
    const s = syllables(opening)
    if (s <= target) {
      words.push(opening.toLowerCase())
      rem -= s
    }
  }
  while (rem > 0) {
    let candidates = pool.filter((w) => syllables(w) <= rem && w !== words[words.length - 1])
    if (candidates.length === 0) candidates = pool.filter((w) => syllables(w) <= rem)
    const w = pick(rng, candidates)
    words.push(w)
    rem -= syllables(w)
  }
  return words.join(' ')
}

export function haiku(stats: RepoStats, rng: Rng, _c: Palette): string {
  const heroFirst = stats.heroes[0]?.name.split(/\s+/)[0] ?? 'someone'
  const stanzas = [
    [fillLine(rng, 5, ORIGINS, stats.name), fillLine(rng, 7, ORIGINS), fillLine(rng, 5, ORIGINS)],
    [fillLine(rng, 5, TOIL), fillLine(rng, 7, TOIL), fillLine(rng, 5, TOIL)],
    [fillLine(rng, 5, TOIL, heroFirst), fillLine(rng, 7, PRESENT), fillLine(rng, 5, PRESENT)],
    [fillLine(rng, 5, PRESENT), fillLine(rng, 7, PRESENT), fillLine(rng, 5, PRESENT)],
  ]
  return stanzas.map((s) => s.join('\n')).join('\n\n') + '\n'
}
