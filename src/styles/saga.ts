import type { Palette } from '../color.js'
import { pick, type Rng } from '../rng.js'
import type { Hero, RepoStats, Trait } from '../types.js'

const EPITHETS: Record<Trait, string[]> = {
  prolific: ['the Relentless', 'the Unyielding', 'Bringer of Ten Thousand Commits', 'the Evergreen'],
  reaper: ['Reaper of Lines', 'the Great Deleter', 'Pruner of Dead Code', 'Bane of Bloat'],
  nightowl: ['the Midnight Blade', 'Keeper of the 3 A.M. Watch', 'the Nocturnal', 'Friend of the Moon'],
  weekender: ['Warden of Weekends', 'the Sunday Smith', 'Sworn Enemy of Rest'],
  builder: ['the Steadfast', 'Mason of Modules', 'the Quiet Architect', 'Layer of Foundations'],
}

const TRAIT_DEEDS: Record<Trait, string[]> = {
  prolific: ['No forge burned hotter.', 'The history bends around this one.', 'Half the kingdom bears this signature.'],
  reaper: ['Where this one walked, dead code dared not linger.', 'More was taken than given, and the realm was lighter for it.'],
  nightowl: ['While the kingdom slept, the work continued.', 'The moon knows this one by name.'],
  weekender: ['When others rested, the anvil rang.', 'Saturdays feared no idle hands.'],
  builder: ['Stone upon stone, without complaint.', 'The quiet work that holds the walls up.'],
}

const AGE_NAMES = [
  'Iron', 'Storms', 'the Great Refactor', 'Feature Fever', 'Green Builds',
  'Broken Pipelines', 'the Long Grind', 'Bold Experiments', 'Quiet Craft', 'Reckoning',
]

const AGE_PATTERNS = ['The Age of {X}', 'The Era of {X}', 'The {X} Campaigns', 'The Winter of {X}']

const OPENINGS = [
  'Hark! Gather close, for this tale is true — every word of it written in the ledger of commits.',
  'Long ago — or possibly last sprint — a repository was carved from the void.',
  'Sing, muse, of branches merged and conflicts vanquished.',
  'Let the record show: this actually happened.',
]

const CLOSINGS = [
  'The saga does not end. It merely awaits the next push.',
  'And somewhere, even now, a working tree sits dirty. The tale continues.',
  'Thus stands the legend — until the next force-push rewrites it.',
  'The chronicle closes here, but the HEAD still moves.',
]

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

function roman(n: number): string {
  const table: [number, string][] = [
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ]
  let out = ''
  for (const [v, s] of table) {
    while (n >= v) {
      out += s
      n -= v
    }
  }
  return out
}

function heroLine(h: Hero, rng: Rng, c: Palette): string {
  const epithet = pick(rng, EPITHETS[h.trait])
  const deed = pick(rng, TRAIT_DEEDS[h.trait])
  return [
    `  ⚔ ${c.hero(h.name)}, ${c.accent(epithet)}`,
    `    ${c.num(plural(h.commits, 'commit'))} · ${c.num('+' + h.additions)} lines raised · ${c.num('−' + h.deletions)} lines slain`,
    `    ${c.dim(deed)}`,
  ].join('\n')
}

export function saga(stats: RepoStats, rng: Rng, c: Palette): string {
  const out: string[] = []
  const r = stats.records

  out.push(c.title(`═══ THE SAGA OF ${stats.name.toUpperCase()} ═══`), '')
  out.push(pick(rng, OPENINGS))
  out.push(
    `For ${c.num(String(stats.spanDays))} days and nights this realm has stood, ` +
      `built from ${c.num(String(stats.totalCommits))} commits, ` +
      `${c.num(String(stats.totalAdditions))} lines raised and ${c.num(String(stats.totalDeletions))} struck down.`,
  )
  out.push('')

  stats.eras.forEach((era, i) => {
    const name = pick(rng, AGE_PATTERNS).replace('{X}', pick(rng, AGE_NAMES))
    out.push(c.title(`Chapter ${roman(i + 1)} — ${name}`))
    const led = pick(rng, [
      `In this age ${c.hero(era.topAuthor)} led the charge`,
      `${c.hero(era.topAuthor)} carried the banner through these days`,
      `The chronicles of this time bear one name above all: ${c.hero(era.topAuthor)}`,
    ])
    out.push(
      `${led}, and ${c.num(plural(era.commits, 'commit'))} ${era.commits === 1 ? 'was' : 'were'} struck upon the anvil.`,
    )
    if (era.topFile) {
      out.push(
        pick(rng, [
          `No scroll was rewritten more often than ${c.accent(era.topFile)}.`,
          `The scribes returned again and again to ${c.accent(era.topFile)}.`,
          `Legend says ${c.accent(era.topFile)} still whispers when the wind is right.`,
        ]),
      )
    }
    out.push('')
  })

  out.push(c.title('THE HEROES OF THIS TALE'))
  for (const h of stats.heroes) out.push(heroLine(h, rng, c))
  out.push('')

  out.push(c.title('LEGENDS & RECORDS'))
  if (r.biggestCommit) {
    out.push(
      `  ◈ In one thunderous commit, ${c.hero(r.biggestCommit.author)} moved ` +
        `${c.num(String(r.biggestCommit.size))} lines — "${r.biggestCommit.message}" — and the earth shook.`,
    )
  }
  if (r.longestGapDays >= 14) {
    out.push(`  ◈ Then came the Great Silence: for ${c.num(String(r.longestGapDays))} days, not a single commit stirred.`)
  }
  if (r.longestStreakDays >= 3) {
    out.push(`  ◈ Once, the forge burned for ${c.num(String(r.longestStreakDays))} days without rest.`)
  }
  if (r.nightCommits > 0) {
    out.push(`  ◈ ${c.num(String(r.nightCommits))} commits were made in the dead of night, when only the linter was watching.`)
  }
  if (r.reverts > 0) {
    out.push(`  ◈ ${c.num(String(r.reverts))} times did the cry of ${c.accent('"Revert!"')} echo across the land.`)
  }
  if (r.fixes > 0) {
    out.push(`  ◈ ${c.num(String(r.fixes))} wounds were bound with the word ${c.accent('"fix"')}.`)
  }
  if (r.favoriteWord) {
    out.push(`  ◈ And always, in every age, they whispered one word: ${c.accent(`"${r.favoriteWord}"`)}.`)
  }
  if (r.shortestMessage && r.shortestMessage.length <= 10) {
    out.push(`  ◈ The tersest decree ever issued: ${c.dim(`"${r.shortestMessage}"`)}. Historians remain puzzled.`)
  }
  out.push('')
  out.push(c.dim(pick(rng, CLOSINGS)))
  return out.join('\n') + '\n'
}
