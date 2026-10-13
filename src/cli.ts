#!/usr/bin/env node
/**
 * Command-line interface shell for the word puzzle solver.
 */

import { existsSync, createReadStream } from "node:fs"
import { createInterface } from "node:readline"
import { Writable } from "node:stream"
import { formatValidationError, validateCliArgs } from "./validation.js"
import { assertNever, Puzzle, ValidationError } from "./domain.js"
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
 * Discriminated algebraic data variants representing the outcome of evaluating
 * command-line arguments.
 */
export type CliAction =
  | {
      /** User requested command usage help text. */
      readonly type: "help"
      readonly text: string
    }
  | {
      /** User requested program version display. */
      readonly type: "version"
      readonly text: string
    }
  | {
      /** Argument parsing or applicative validation encountered failures. */
      readonly type: "error"
      readonly exitCode: 1 | 2
      readonly errors: readonly ValidationError[]
      readonly messages: readonly string[]
    }
  | {
      /** Arguments successfully validated into an executable puzzle. */
      readonly type: "solve"
      readonly puzzle: Puzzle
    }

interface ParsedCliValues {
  size?: string
  letters?: string
  dictionary?: string
  repeats?: boolean
  help?: boolean
  version?: boolean
}

type StringOptionKey = "size" | "letters" | "dictionary"

const VALUE_OPTIONS: Readonly<Record<string, StringOptionKey>> = {
  "-s": "size",
  "--size": "size",
  "-l": "letters",
  "--letters": "letters",
  "-d": "dictionary",
  "--dictionary": "dictionary",
}

/**
 * Scans raw command-line arguments into parsed options and syntax errors.
 * Pure function with referential transparency over the argument vector.
 *
 * @param args - Raw command-line argument strings.
 * @returns Record containing parsed options and accumulated syntax errors.
 */
function parseCliArgs(args: readonly string[]): {
  readonly values: ParsedCliValues
  readonly errors: readonly ValidationError[]
} {
  const errors: ValidationError[] = []
  const values: ParsedCliValues = {}

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    if (arg === undefined) {
      continue
    }

    if (arg === "--help" || arg === "-h") {
      values.help = true
      continue
    }

    if (arg === "--version" || arg === "-v") {
      values.version = true
      continue
    }

    const optKey = VALUE_OPTIONS[arg]
    if (optKey !== undefined) {
      const next = args[i + 1]
      if (next === undefined || next.startsWith("-")) {
        const flagName = arg.startsWith("--") ? arg : `--${optKey}`
        errors.push({
          type: "unexpected_argument",
          detail: `Option '${flagName}' requires a value.`,
        })
      } else {
        values[optKey] = next
        i += 1
      }
      continue
    }

    if (arg === "--repeats" || arg === "-r") {
      values.repeats = true
      continue
    }

    if (arg.startsWith("-")) {
      errors.push({
        type: "unexpected_argument",
        detail: `Unknown option '${arg}'.`,
      })
      continue
    }

    errors.push({
      type: "unexpected_argument",
      detail: `Unexpected positional argument '${arg}'.`,
    })
  }

  return { values, errors }
}

/**
 * Evaluates command-line arguments into a pure domain action.
 * Pure function with referential transparency.
 *
 * @param args - Raw command-line argument vector.
 * @returns Discriminated CliAction indicating the requested operation.
 * @example
 * ```ts
 * const action = evaluateCli(["-s", "7", "-l", "cadevrsoi"])
 * ```
 */
export function evaluateCli(args: readonly string[]): CliAction {
  const { values, errors } = parseCliArgs(args)

  if (values.help) {
    return { type: "help", text: HELP_TEXT }
  }

  if (values.version) {
    return { type: "version", text: `${VERSION}\n` }
  }

  const validationResult = validateCliArgs({
    size: values.size,
    letters: values.letters,
    dictionary: values.dictionary,
    repeats: values.repeats,
  })

  if (!validationResult.ok || errors.length > 0) {
    const allErrors = validationResult.ok
      ? errors
      : [...errors, ...validationResult.errors]
    const messages = allErrors.map(
      (error): string => `Error: ${formatValidationError(error)}`,
    )
    return {
      type: "error",
      exitCode: errors.length > 0 ? 2 : 1,
      errors: allErrors,
      messages,
    }
  }

  return {
    type: "solve",
    puzzle: validationResult.value,
  }
}

/**
 * Executes the word puzzle CLI with supplied arguments and output streams.
 * Effectful shell dispatching the evaluated action to console I/O and streams.
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
  const action = evaluateCli(args)

  switch (action.type) {
    case "help":
      stdout.write(action.text)
      return 0

    case "version":
      stdout.write(action.text)
      return 0

    case "error":
      for (const message of action.messages) {
        stderr.write(`${message}\n`)
      }
      return action.exitCode

    case "solve": {
      if (!existsSync(action.puzzle.dictionary)) {
        stderr.write(
          `Dictionary file not found: '${action.puzzle.dictionary}'.\n`,
        )
        return 1
      }

      const stream = createReadStream(action.puzzle.dictionary, {
        encoding: "utf-8",
      })
      const rl = createInterface({ input: stream, crlfDelay: Infinity })

      try {
        for await (const match of solve(action.puzzle, rl)) {
          stdout.write(`${match}\n`)
        }
      } finally {
        rl.close()
        stream.destroy()
      }

      return 0
    }

    default:
      return assertNever(action)
  }
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
