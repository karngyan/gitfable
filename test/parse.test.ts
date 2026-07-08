import { describe, expect, it } from 'vitest'
import { parseGitLog } from '../src/parse.js'

const RS = '\x1e'
const FS = '\x1f'

function record(fields: string[], numstat: string[]): string {
  return RS + fields.join(FS) + '\n\n' + numstat.join('\n') + '\n'
}

const raw =
  record(
    ['abc123', 'Karn', 'mail@karngyan.com', '2026-07-01T23:30:00+05:30', 'feat: add saga mode'],
    ['10\t2\tsrc/saga.ts', '5\t0\tREADME.md'],
  ) +
  record(
    ['def456', 'Ada', 'ada@example.com', '2026-07-02T03:15:00+00:00', 'fix: binary assets'],
    ['-\t-\tlogo.png', '1\t1\tsrc/fix.ts'],
  ) +
  RS +
  ['ghi789', 'Karn', 'mail@karngyan.com', '2026-07-03T10:00:00+05:30', 'docs: no files here'].join(FS) +
  '\n'

describe('parseGitLog', () => {
  it('parses commits with authors, dates, and messages', () => {
    const commits = parseGitLog(raw)
    expect(commits).toHaveLength(3)
    expect(commits[0]).toMatchObject({
      hash: 'abc123',
      author: 'Karn',
      email: 'mail@karngyan.com',
      message: 'feat: add saga mode',
    })
    expect(commits[0]!.date.toISOString()).toBe('2026-07-01T18:00:00.000Z')
  })

  it('sums numstat additions and deletions', () => {
    const commits = parseGitLog(raw)
    expect(commits[0]!.additions).toBe(15)
    expect(commits[0]!.deletions).toBe(2)
    expect(commits[0]!.files).toHaveLength(2)
  })

  it('treats binary numstat columns as zero', () => {
    const commits = parseGitLog(raw)
    const binary = commits[1]!.files.find((f) => f.path === 'logo.png')
    expect(binary).toMatchObject({ additions: 0, deletions: 0 })
    expect(commits[1]!.additions).toBe(1)
  })

  it('handles commits with no file changes', () => {
    const commits = parseGitLog(raw)
    expect(commits[2]!.files).toHaveLength(0)
    expect(commits[2]!.additions).toBe(0)
  })

  it('extracts author-local hour and weekday from the ISO offset', () => {
    const commits = parseGitLog(raw)
    expect(commits[0]!.hourLocal).toBe(23)
    expect(commits[1]!.hourLocal).toBe(3)
    // 2026-07-01 is a Wednesday
    expect(commits[0]!.dayLocal).toBe(3)
  })

  it('returns empty array for empty input', () => {
    expect(parseGitLog('')).toEqual([])
    expect(parseGitLog('\n')).toEqual([])
  })
})
