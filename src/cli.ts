#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { basename } from 'node:path'
import { analyze } from './analyze.js'
import { makePalette } from './color.js'
import { GIT_LOG_FORMAT, parseGitLog } from './parse.js'
import { makeRng } from './rng.js'
import { haiku } from './styles/haiku.js'
import { noir } from './styles/noir.js'
import { saga } from './styles/saga.js'

const VERSION = '0.1.0'

const STYLES = { saga, noir, haiku } as const
type StyleName = keyof typeof STYLES

const HELP = `gitfable — your git history, retold as a legend

Usage:
  gitfable [path] [options]

Options:
  -s, --style <name>   saga (default), noir, or haiku
      --seed <text>    override the story seed (default: repo name)
      --max <n>        only read the last n commits
      --no-color       plain text output
  -h, --help           show this help
  -v, --version        show version

Examples:
  gitfable                      # the saga of the current repo
  gitfable ~/code/my-app -s noir
  gitfable --style haiku
`

interface Args {
  path: string
  style: StyleName
  seed: string | null
  max: number | null
  color: boolean
}

function parseArgs(argv: string[]): Args {
  const args: Args = { path: '.', style: 'saga', seed: null, max: null, color: true }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!
    switch (a) {
      case '-h':
      case '--help':
        process.stdout.write(HELP)
        process.exit(0)
      case '-v':
      case '--version':
        process.stdout.write(`gitfable ${VERSION}\n`)
        process.exit(0)
      case '-s':
      case '--style': {
        const s = argv[++i]
        if (!s || !(s in STYLES)) fail(`--style must be one of: ${Object.keys(STYLES).join(', ')}`)
        args.style = s as StyleName
        break
      }
      case '--seed':
        args.seed = argv[++i] ?? null
        if (args.seed === null) fail('--seed needs a value')
        break
      case '--max': {
        const n = Number(argv[++i])
        if (!Number.isInteger(n) || n <= 0) fail('--max needs a positive integer')
        args.max = n
        break
      }
      case '--no-color':
        args.color = false
        break
      default:
        if (a.startsWith('-')) fail(`unknown option: ${a}\n\n${HELP}`)
        args.path = a
    }
  }
  return args
}

function fail(message: string): never {
  process.stderr.write(`gitfable: ${message}\n`)
  process.exit(1)
}

function git(cwd: string, ...gitArgs: string[]): string {
  return execFileSync('git', ['-C', cwd, ...gitArgs], {
    encoding: 'utf8',
    maxBuffer: 512 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function main(): void {
  const args = parseArgs(process.argv.slice(2))

  let repoRoot: string
  try {
    repoRoot = git(args.path, 'rev-parse', '--show-toplevel').trim()
  } catch {
    fail(`'${args.path}' is not a git repository (or git is not installed) — no legend to tell.`)
  }
  const repoName = basename(repoRoot)

  const logArgs = ['log', `--pretty=format:${GIT_LOG_FORMAT}`, '--numstat']
  if (args.max !== null) logArgs.push(`-n${args.max}`)

  let raw = ''
  try {
    raw = git(args.path, ...logArgs)
  } catch {
    // fall through: empty repos make `git log` exit non-zero
  }

  const commits = parseGitLog(raw)
  if (commits.length === 0) {
    process.stdout.write(
      `The legend of ${repoName} is still unwritten. Make a commit, and the tale shall begin.\n`,
    )
    return
  }

  const stats = analyze(repoName, commits)
  const rng = makeRng(args.seed ?? repoName)
  const colorEnabled = args.color && process.stdout.isTTY === true && !process.env['NO_COLOR']
  const palette = makePalette(colorEnabled)

  process.stdout.write('\n' + STYLES[args.style](stats, rng, palette) + '\n')
}

main()
