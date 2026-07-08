export interface FileChange {
  path: string
  additions: number
  deletions: number
}

export interface Commit {
  hash: string
  author: string
  email: string
  date: Date
  message: string
  additions: number
  deletions: number
  files: FileChange[]
  /** hour of day in the author's own timezone (from the ISO offset) */
  hourLocal: number
  /** day of week in the author's own timezone, 0 = Sunday */
  dayLocal: number
}

export type Trait = 'prolific' | 'reaper' | 'nightowl' | 'weekender' | 'builder'

export interface Hero {
  name: string
  commits: number
  additions: number
  deletions: number
  nightCommits: number
  weekendCommits: number
  trait: Trait
}

export interface Era {
  start: Date
  end: Date
  commits: number
  topAuthor: string
  topFile: string | null
}

export interface Records {
  biggestCommit: { hash: string; message: string; author: string; size: number } | null
  longestGapDays: number
  longestStreakDays: number
  busiestDay: { date: string; commits: number } | null
  reverts: number
  merges: number
  fixes: number
  nightCommits: number
  shortestMessage: string | null
  favoriteWord: string | null
}

export interface RepoStats {
  name: string
  firstDate: Date
  lastDate: Date
  spanDays: number
  totalCommits: number
  totalAdditions: number
  totalDeletions: number
  heroes: Hero[]
  eras: Era[]
  topFiles: { path: string; changes: number }[]
  records: Records
}
