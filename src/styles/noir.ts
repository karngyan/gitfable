import type { Palette } from '../color.js'
import { pick, type Rng } from '../rng.js'
import type { Hero, RepoStats, Trait } from '../types.js'

const OPENINGS = [
  'It was raining the night the repo walked into my office. It always is.',
  'The clone finished at 2 a.m. I poured a coffee and read the log. Bad habit.',
  'Some cases you take for the money. This one I took because the history looked dirty.',
  "The badge on the door says 'detective'. The git log says 'accomplice'.",
]

const CLOSINGS = [
  'Case status: open. They always are.',
  'I filed the report and deleted my local copy. Some histories you don\'t keep around.',
  'The repo is still out there, accepting commits. I try not to think about it.',
  'I closed the laptop. The blame, as always, was distributed.',
]

const RAP_SHEET: Record<Trait, string[]> = {
  prolific: ['Fingerprints on everything.', 'Half the file tree answers to this name.'],
  reaper: ['Likes to make code disappear. Nobody asks where it goes.', 'Deletions outnumber additions. Draw your own conclusions.'],
  nightowl: ['Only works after midnight. The commits confirm it.', 'Timestamped at 3 a.m. Repeatedly. Nobody works those hours for fun.'],
  weekender: ['Alibi for weekdays checks out. Weekends are another story.', 'Saturday commits. The desperate kind.'],
  builder: ['Keeps a low profile. Steady hands. The dangerous type.', 'No flashy commits. Just quiet, methodical work. I respect that.'],
}

function suspect(h: Hero, rng: Rng, c: Palette): string {
  return [
    `  SUSPECT: ${c.hero(h.name)}`,
    `    ${c.num(`${h.commits} hit${h.commits === 1 ? '' : 's'}`)} on record. ${c.num(String(h.additions))} lines in, ${c.num(String(h.deletions))} gone without a trace.`,
    `    ${c.dim(pick(rng, RAP_SHEET[h.trait]))}`,
  ].join('\n')
}

export function noir(stats: RepoStats, rng: Rng, c: Palette): string {
  const out: string[] = []
  const r = stats.records
  let exhibit = 'A'.charCodeAt(0)
  const nextExhibit = () => String.fromCharCode(exhibit++)

  out.push(c.title(`CASE FILE: "${stats.name.toUpperCase()}"`), '')
  out.push(pick(rng, OPENINGS))
  out.push(
    `${c.num(String(stats.totalCommits))} commits over ${c.num(String(stats.spanDays))} days. ` +
      `${c.num(String(stats.heroes.length))} suspects. Nobody was talking, so I let the log do it for them.`,
  )
  out.push('')

  out.push(c.title('THE SUSPECTS'))
  for (const h of stats.heroes) out.push(suspect(h, rng, c))
  out.push('')

  out.push(c.title('THE EVIDENCE'))
  if (r.biggestCommit) {
    out.push(
      `  EXHIBIT ${nextExhibit()}: one commit moving ${c.num(String(r.biggestCommit.size))} lines. ` +
        `"${r.biggestCommit.message}". ${c.hero(r.biggestCommit.author)} claims it was 'a refactor'. Sure it was.`,
    )
  }
  if (r.nightCommits > 0) {
    out.push(`  EXHIBIT ${nextExhibit()}: ${c.num(String(r.nightCommits))} commits after midnight. Honest code sleeps.`)
  }
  if (r.reverts > 0) {
    out.push(`  EXHIBIT ${nextExhibit()}: ${c.num(String(r.reverts))} reverts. Somebody kept trying to undo the past. It never works.`)
  }
  if (r.fixes > 0) {
    out.push(`  EXHIBIT ${nextExhibit()}: the word 'fix' appears ${c.num(String(r.fixes))} times. Each one an admission.`)
  }
  if (r.longestGapDays >= 14) {
    out.push(`  EXHIBIT ${nextExhibit()}: a ${c.num(String(r.longestGapDays))}-day gap in the record. Where was everybody? I have theories.`)
  }
  if (r.favoriteWord) {
    out.push(`  EXHIBIT ${nextExhibit()}: they kept writing one word — ${c.accent(`'${r.favoriteWord}'`)}. Obsession, or code word? Case pending.`)
  }
  if (r.busiestDay) {
    out.push(`  EXHIBIT ${nextExhibit()}: ${c.num(String(r.busiestDay.commits))} commits on ${r.busiestDay.date} alone. That's not productivity. That's panic.`)
  }
  out.push('')
  out.push(c.dim(pick(rng, CLOSINGS)))
  return out.join('\n') + '\n'
}
