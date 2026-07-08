# gitfable — design

**One-liner:** read a repo's git history, retell it as a story. Zero runtime
dependencies, deterministic per repo (seeded RNG), three narrative styles.

## Why

Git history is full of drama — reverts, midnight commits, heroic refactors —
but `git log` renders it as bureaucracy. gitfable renders it as legend.

## Approaches considered

1. **LLM-backed narration** — richest prose, but needs API keys, network, and
   money; output is non-deterministic and un-testable. Rejected.
2. **Static template fill-in** — trivially testable but every repo reads the
   same. Rejected as boring.
3. **Stats engine + seeded template banks (chosen)** — analyze real history
   into typed stats (heroes, eras, records), then narrate via style modules
   that pick from variant banks with an RNG seeded from the repo name. Every
   repo gets its own stable legend; every function stays pure and testable.

## Architecture

```
git log ──raw text──▶ parse.ts ──Commit[]──▶ analyze.ts ──RepoStats──▶ styles/* ──string──▶ stdout
                                                              ▲
                                                        rng.ts (seeded)
```

- `src/rng.ts` — fnv1a string hash + mulberry32 PRNG; `pick`/`shuffle` helpers.
- `src/parse.ts` — parses `git log --numstat` with control-char separators
  (`\x1e` record, `\x1f` field) into `Commit[]`. Pure: takes raw string.
- `src/analyze.ts` — pure `Commit[] → RepoStats`: heroes (ranked authors with
  standout traits), eras (timeline chunks), records (biggest commit, longest
  gap, streaks, night-owl counts, revert/fix/merge tallies), top files.
- `src/styles/{saga,noir,haiku}.ts` — `(stats, rng) → string`. Saga is the
  default epic; noir is a hard-boiled case file; haiku emits 5-7-5 verses
  validated by a heuristic syllable counter.
- `src/color.ts` — tiny ANSI helpers; respects `NO_COLOR`, `--no-color`, and
  non-TTY stdout.
- `src/cli.ts` — arg parsing (by hand, no deps), runs git, friendly errors
  (not a repo, empty repo), prints narration.

## Error handling

- Not a git repo / git missing → one-line friendly error, exit 1.
- Empty history → a short "unwritten legend" message, exit 0.
- Binary files in numstat (`-` columns) parsed as 0/0.

## Testing

Vitest on the pure core: RNG determinism, parser against a fixture log
(incl. binary files), analyzer against synthetic commits, each style checked
for determinism (same seed → identical output), presence of real data
(hero names, repo name), and haiku syllable counts per our counter.

## Non-goals (YAGNI)

No config file, no plugins, no localization, no LLM mode, no git bindings —
shelling out to `git` is the portable, dependency-free move.
