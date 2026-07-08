import type { Commit, FileChange } from './types.js'

/**
 * Record separator \x1e between commits, unit separator \x1f between fields:
 * hash, author name, author email, author date (ISO strict), subject.
 * --numstat rows follow each header.
 */
export const GIT_LOG_FORMAT = '%x1e%H%x1f%an%x1f%ae%x1f%aI%x1f%s'

const NUMSTAT = /^(\d+|-)\t(\d+|-)\t(.+)$/

export function parseGitLog(raw: string): Commit[] {
  const commits: Commit[] = []
  for (const record of raw.split('\x1e')) {
    if (record.trim() === '') continue
    const lines = record.split('\n')
    const fields = lines[0]!.split('\x1f')
    if (fields.length < 5) continue
    const [hash, author, email, iso, message] = fields as [string, string, string, string, string]

    const files: FileChange[] = []
    for (const line of lines.slice(1)) {
      const m = NUMSTAT.exec(line)
      if (!m) continue
      files.push({
        path: m[3]!,
        additions: m[1] === '-' ? 0 : Number(m[1]),
        deletions: m[2] === '-' ? 0 : Number(m[2]),
      })
    }

    // Reading the wall-clock portion of the ISO date as UTC yields the
    // author's own local hour/weekday, independent of this machine's tz.
    const local = new Date(iso.slice(0, 19) + 'Z')

    commits.push({
      hash,
      author,
      email,
      date: new Date(iso),
      message,
      additions: files.reduce((n, f) => n + f.additions, 0),
      deletions: files.reduce((n, f) => n + f.deletions, 0),
      files,
      hourLocal: local.getUTCHours(),
      dayLocal: local.getUTCDay(),
    })
  }
  return commits
}
