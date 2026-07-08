import { describe, expect, it } from 'vitest'
import { analyze } from '../src/analyze.js'
import { makePalette } from '../src/color.js'
import { makeRng } from '../src/rng.js'
import { haiku, lineSyllables } from '../src/styles/haiku.js'
import { noir } from '../src/styles/noir.js'
import { saga } from '../src/styles/saga.js'
import type { Commit } from '../src/types.js'

function mk(i: number, author: string, message: string): Commit {
  const day = String((i % 27) + 1).padStart(2, '0')
  const month = String(Math.floor(i / 27) + 1).padStart(2, '0')
  const iso = `2025-${month}-${day}T1${i % 9}:00:00+00:00`
  return {
    hash: `hash${i}`,
    author,
    email: `${author}@example.com`,
    date: new Date(iso),
    message,
    additions: (i * 7) % 100,
    deletions: (i * 3) % 40,
    files: [{ path: `src/file${i % 5}.ts`, additions: 1, deletions: 0 }],
    hourLocal: 10 + (i % 9),
    dayLocal: i % 7,
  }
}

const commits = Array.from({ length: 60 }, (_, i) =>
  mk(i, i % 3 === 0 ? 'Karn' : 'Ada', i % 10 === 0 ? 'fix: engine trouble' : 'grow the engine'),
)
const stats = analyze('starship', commits)
const plain = makePalette(false)

describe.each([
  ['saga', saga],
  ['noir', noir],
  ['haiku', haiku],
] as const)('%s style', (_name, narrate) => {
  it('is deterministic for the same seed', () => {
    const a = narrate(stats, makeRng('seed-1'), plain)
    const b = narrate(stats, makeRng('seed-1'), plain)
    expect(a).toBe(b)
  })

  it('varies with the seed', () => {
    const a = narrate(stats, makeRng('seed-1'), plain)
    const b = narrate(stats, makeRng('seed-2'), plain)
    expect(a).not.toBe(b)
  })

  it('produces non-trivial output', () => {
    expect(narrate(stats, makeRng('seed-1'), plain).length).toBeGreaterThan(100)
  })
})

describe('saga', () => {
  it('names the repo and its top hero', () => {
    const out = saga(stats, makeRng('seed-1'), plain)
    expect(out.toLowerCase()).toContain('starship')
    expect(out).toContain('Karn')
  })
})

describe('noir', () => {
  it('reads like a case file with suspects', () => {
    const out = noir(stats, makeRng('seed-1'), plain)
    expect(out.toLowerCase()).toContain('starship')
    expect(out).toContain('Karn')
    expect(out).toContain('Ada')
  })
})

describe('haiku', () => {
  it('emits 5-7-5 verses per the syllable heuristic', () => {
    const out = haiku(stats, makeRng('seed-1'), plain)
    const stanzas = out
      .trim()
      .split('\n\n')
      .map((s) => s.split('\n').filter((l) => l.trim().length > 0))
    expect(stanzas.length).toBeGreaterThanOrEqual(3)
    for (const lines of stanzas) {
      expect(lines).toHaveLength(3)
      expect(lineSyllables(lines[0]!)).toBe(5)
      expect(lineSyllables(lines[1]!)).toBe(7)
      expect(lineSyllables(lines[2]!)).toBe(5)
    }
  })
})
