# gitfable

> Your git history, retold as an epic saga. Also does noir and haiku.

`git log` renders your repo's history as bureaucracy. **gitfable** renders it
as legend — the heroes, the eras, the great silences, the 3 a.m. commits, the
cry of *"Revert!"* echoing across the land.

Zero runtime dependencies. Works on any git repo. Every repo gets its own
deterministic story (seeded by repo name), so your legend is stable — until
history changes.

## Usage

```bash
npx gitfable                        # the saga of the current repo
npx gitfable ~/code/my-app -s noir  # hard-boiled case file
npx gitfable --style haiku          # 5-7-5, guaranteed by law
npx gitfable --seed "alt timeline"  # re-roll the narration

# or keep it around:
npm install -g gitfable
```

## A real saga (this is karngyan.com)

```
═══ THE SAGA OF KARNGYAN.COM ═══

Hark! Gather close, for this tale is true — every word of it written in the ledger of commits.
For 1850 days and nights this realm has stood, built from 56 commits,
33759 lines raised and 16934 struck down.

THE HEROES OF THIS TALE
  ⚔ Karn, the Nocturnal
    41 commits · +33686 lines raised · −16901 lines slain
    While the kingdom slept, the work continued.

LEGENDS & RECORDS
  ◈ In one thunderous commit, Karn moved 32499 lines — "Revamp: Nuxt 2 →
    TanStack Start, React 19, Tailwind v4, Cloudflare Workers (#26)" — and the earth shook.
  ◈ Then came the Great Silence: for 1550 days, not a single commit stirred.
  ◈ 30 commits were made in the dead of night, when only the linter was watching.
  ◈ 12 wounds were bound with the word "fix".

The saga does not end. It merely awaits the next push.
```

And in noir:

```
CASE FILE: "KARNGYAN.COM"

It was raining the night the repo walked into my office. It always is.
56 commits over 1850 days. 5 suspects. Nobody was talking, so I let the log
do it for them.

  SUSPECT: Karn
    41 hits on record. 33686 lines in, 16901 gone without a trace.
    Only works after midnight. The commits confirm it.
```

## Styles

| Style   | Vibe                                             |
| ------- | ------------------------------------------------ |
| `saga`  | Norse epic. Heroes, eras, legends. (default)     |
| `noir`  | Rainy-night detective. Everyone is a suspect.    |
| `haiku` | 5-7-5 verses, validated by the syllable counter. |

## How it works

```
git log --numstat  →  parse  →  analyze  →  narrate  →  your legend
                                    ↑
                            seeded RNG (repo name)
```

1. **Parse** — reads `git log` with control-character separators into typed commits.
2. **Analyze** — pure stats: ranked heroes with standout traits (night owl,
   line reaper, weekend warden…), timeline eras, records (biggest commit,
   longest silence, streaks, revert count, the one word you can't stop
   writing in commit messages).
3. **Narrate** — style modules pick from template banks with an RNG seeded
   from the repo name. Same repo, same legend. `--seed` for alternate timelines.

The haiku style generates and validates lines against the same heuristic
syllable counter, so every verse is 5-7-5 *by construction*. English may
occasionally disagree. The counter is the law.

## Development

```bash
pnpm install
pnpm test        # vitest — the whole core is pure and tested
pnpm typecheck
pnpm build
```

## License

MIT © [Gyan Prakash Karn](https://karngyan.com)
