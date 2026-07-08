import { describe, expect, it } from 'vitest'
import { int, makeRng, pick } from '../src/rng.js'

describe('makeRng', () => {
  it('is deterministic for the same seed string', () => {
    const a = makeRng('karngyan.com')
    const b = makeRng('karngyan.com')
    const seqA = Array.from({ length: 20 }, () => a())
    const seqB = Array.from({ length: 20 }, () => b())
    expect(seqA).toEqual(seqB)
  })

  it('produces different sequences for different seeds', () => {
    const a = makeRng('repo-one')
    const b = makeRng('repo-two')
    const seqA = Array.from({ length: 20 }, () => a())
    const seqB = Array.from({ length: 20 }, () => b())
    expect(seqA).not.toEqual(seqB)
  })

  it('stays within [0, 1)', () => {
    const rng = makeRng('bounds')
    for (let i = 0; i < 1000; i++) {
      const n = rng()
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThan(1)
    }
  })
})

describe('pick', () => {
  it('only returns elements from the array', () => {
    const rng = makeRng('pick')
    const arr = ['a', 'b', 'c']
    for (let i = 0; i < 100; i++) {
      expect(arr).toContain(pick(rng, arr))
    }
  })
})

describe('int', () => {
  it('returns integers within the inclusive range', () => {
    const rng = makeRng('int')
    for (let i = 0; i < 500; i++) {
      const n = int(rng, 2, 5)
      expect(Number.isInteger(n)).toBe(true)
      expect(n).toBeGreaterThanOrEqual(2)
      expect(n).toBeLessThanOrEqual(5)
    }
  })
})
