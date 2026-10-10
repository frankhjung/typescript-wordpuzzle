#!/usr/bin/env node
/**
 * Command-line interface shell for the word puzzle solver.
 */

import { existsSync, createReadStream } from "node:fs"
import { createInterface } from "node:readline"
import { parseArgs } from "node:util"
import { Writable } from "node:stream"
import { formatValidationError, validateCliArgs } from "./validation.js"
import { solve } from "./solver.js"

export const VERSION = "0.1.0"

export const HELP_TEXT = `Usage: wordpuzzle [options]

Solve 9-letter word puzzles and Spelling Bee games

Options:
  -s, --size <number>        Minimum word size between 4 and 9 (default: 4)
  -l, --letters <string>     4-9 unique lowercase letters to form words
  -d, --dictionary <path>    Path to dictionary file (default: "dictionary")
  -r, --repeats              Allow letters to repeat (Spelling Bee mode)
  -h, --help                 Display this help message
  -v, --version              Display program version
`

/**
 * Executes the word puzzle CLI with supplied arguments and output streams.
 * Effectful shell coordinating argument parsing, file reading, and console I/O.
 *
 * @param args - Command-line argument vector (excluding node and script paths).
 * @param stdout - Output stream for solutions, help text, and version display.
 * @param stderr - Error stream for diagnostic and validation error reporting.
 * @returns Promise resolving to program exit code (0, 1, or 2).
 * @example
 * ```ts
 * const exitCode = await runCli(["-s", "7", "-l", "cadevrsoi"])
 * ```
 */
export async function runCli(
  args: readonly string[],
  stdout: Writable = process.stdout,
  stderr: Writable = process.stderr,
): Promise<number> {
  let parsed
  try {
    parsed = parseArgs({
      args: [...args],
      options: {
        size: { type: "string", short: "s" },
        letters: { type: "string", short: "l" },
        dictionary: { type: "string", short: "d" },
        repeats: { type: "boolean", short: "r" },
        help: { type: "boolean", short: "h" },
        version: { type: "boolean", short: "v" },
      },
      strict: true,
      allowPositionals: false,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    stderr.write(`Error: ${message}\n`)
    return 2
  }

  if (parsed.values.help) {
    stdout.write(HELP_TEXT)
    return 0
  }

  if (parsed.values.version) {
    stdout.write(`${VERSION}\n`)
    return 0
  }

  const validationResult = validateCliArgs({
    size: parsed.values.size,
    letters: parsed.values.letters,
    dictionary: parsed.values.dictionary,
    repeats: parsed.values.repeats,
  })

  if (!validationResult.ok) {
    for (const error of validationResult.errors) {
      stderr.write(`${formatValidationError(error)}\n`)
    }
    return 1
  }

  const puzzle = validationResult.value

  if (!existsSync(puzzle.dictionary)) {
    stderr.write(`Dictionary file not found: '${puzzle.dictionary}'.\n`)
    return 1
  }

  const stream = createReadStream(puzzle.dictionary, { encoding: "utf-8" })
  const rl = createInterface({ input: stream, crlfDelay: Infinity })

  try {
    for await (const match of solve(puzzle, rl)) {
      stdout.write(`${match}\n`)
    }
  } finally {
    rl.close()
    stream.destroy()
  }

  return 0
}

/* v8 ignore start */
process.stdout.on("error", (err: NodeJS.ErrnoException): void => {
  if (err.code === "EPIPE") {
    process.exit(0)
  }
})

const isDirectExecution =
  process.argv[1] !== undefined &&
  (process.argv[1].endsWith("cli.ts") ||
    process.argv[1].endsWith("cli.js") ||
    process.argv[1].endsWith("wordpuzzle"))

if (isDirectExecution) {
  runCli(process.argv.slice(2)).then(
    (code: number): void => {
      process.exitCode = code
    },
    (error: unknown): void => {
      process.stderr.write(
        `${error instanceof Error ? error.message : String(error)}\n`,
      )
      process.exitCode = 1
    },
  )
}
/* v8 ignore stop */
