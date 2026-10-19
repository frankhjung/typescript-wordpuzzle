/**
 * Pure applicative input validation for puzzle command-line arguments.
 */

import {
  LetterPool,
  MandatoryChar,
  Puzzle,
  Result,
  ValidationError,
  WordSize,
  assertNever,
  createPuzzle,
  err,
  ok,
  toLetterPool,
  toMandatoryChar,
  toWordSize,
} from "./domain.js"

export interface RawCliArgs {
  readonly size?: number | string | undefined
  readonly letters?: string | undefined
  readonly dictionary?: string | undefined
  readonly repeats?: boolean | undefined
}

/**
 * Validates the word size parameter against bounds [4, 9].
 * Pure function with referential transparency.
 *
 * @param raw - Raw size parameter value.
 * @returns Result containing branded WordSize or ValidationError.
 * @example
 * ```ts
 * const res = validateWordSize(7)
 * ```
 */
function validateWordSize(
  raw: number | string | undefined,
): Result<WordSize, ValidationError> {
  if (raw === undefined) {
    return ok(toWordSize(4))
  }

  const parsed = typeof raw === "string" ? Number(raw) : raw

  if (
    typeof parsed !== "number" ||
    Number.isNaN(parsed) ||
    !Number.isInteger(parsed) ||
    parsed < 4 ||
    parsed > 9
  ) {
    return err([
      {
        type: "invalid_size",
        min: 4,
        max: 9,
        actual: parsed,
      },
    ])
  }

  return ok(toWordSize(parsed))
}

export interface ValidatedLetters {
  readonly letters: LetterPool
  readonly mandatory: MandatoryChar
}

/**
 * Validates the letter pool parameter.
 * Pure function with referential transparency.
 *
 * @param raw - Raw letters parameter string.
 * @returns Result containing letter pool and mandatory char, or error.
 * @example
 * ```ts
 * const res = validateLetters("cadevrsoi")
 * ```
 */
function validateLetters(
  raw: string | undefined,
): Result<ValidatedLetters, ValidationError> {
  if (raw === undefined || raw.trim().length === 0) {
    return err([{ type: "missing_letters" }])
  }

  const trimmed = raw.trim()

  if (!/^[a-z]+$/.test(trimmed)) {
    return err([
      {
        type: "invalid_letters",
        actual: trimmed,
        reason: "Letters must only contain lowercase ASCII characters (a-z).",
      },
    ])
  }

  if (trimmed.length < 4 || trimmed.length > 9) {
    return err([
      {
        type: "invalid_letters",
        actual: trimmed,
        reason: "Letters must contain between 4 and 9 characters.",
      },
    ])
  }

  const uniqueChars = new Set(trimmed)
  if (uniqueChars.size !== trimmed.length) {
    return err([
      {
        type: "invalid_letters",
        actual: trimmed,
        reason: "Letters must all be unique without duplicates.",
      },
    ])
  }

  const pool = toLetterPool(trimmed)
  const mandatory = toMandatoryChar(trimmed.charAt(0))

  return ok({ letters: pool, mandatory })
}

/**
 * Validates raw CLI arguments using applicative error accumulation.
 * Pure function with referential transparency.
 *
 * @param args - Raw CLI arguments record.
 * @returns Result containing validated Puzzle or accumulated errors.
 * @example
 * ```ts
 * const res = validateCliArgs({ size: 7, letters: "cadevrsoi" })
 * ```
 */
export function validateCliArgs(
  args: RawCliArgs,
): Result<Puzzle, ValidationError> {
  const sizeResult = validateWordSize(args.size)
  const lettersResult = validateLetters(args.letters)

  if (!sizeResult.ok || !lettersResult.ok) {
    return err([
      ...(sizeResult.ok ? [] : sizeResult.errors),
      ...(lettersResult.ok ? [] : lettersResult.errors),
    ])
  }

  const dictionary = args.dictionary?.trim() || "dictionary"
  const repeats = args.repeats ?? false

  try {
    return ok(
      createPuzzle({
        size: sizeResult.value,
        mandatory: lettersResult.value.mandatory,
        letters: lettersResult.value.letters,
        dictionary,
        repeats,
      }),
    )
  } catch {
    return err([
      {
        type: "invalid_puzzle",
        detail: "Puzzle configuration violated domain invariants.",
      },
    ])
  }
}

/**
 * Formats a validation error into a human-readable Australian English string.
 * Pure function with referential transparency.
 *
 * @param error - The validation error variant to format.
 * @returns Formatted human-readable error description.
 * @example
 * ```ts
 * const msg = formatValidationError(err)
 * ```
 */
export function formatValidationError(error: ValidationError): string {
  switch (error.type) {
    case "invalid_size":
      return (
        `Invalid size '${error.actual}': ` +
        `size must be an integer between ${error.min} and ${error.max}.`
      )
    case "invalid_letters":
      return `Invalid letters '${error.actual}': ${error.reason}`
    case "missing_letters":
      return "Missing required option: --letters (-l)."
    case "invalid_puzzle":
      return `Invalid puzzle configuration: ${error.detail}`
    case "unexpected_argument":
      return `Unexpected argument: ${error.detail}`
    case "missing_mandatory":
      return "Missing required mandatory letter."
    case "invalid_mandatory":
      return (
        `Invalid mandatory letter '${error.actual}': ` +
        "mandatory letter must be a single lowercase letter ('a' to 'z')."
      )
    default:
      return assertNever(error)
  }
}
