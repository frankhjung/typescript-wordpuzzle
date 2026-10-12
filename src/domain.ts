/**
 * Domain models, branded nominal types, and Result algebraic data type.
 */

export type WordSize = number & { readonly __brand: unique symbol }
export type LetterPool = string & { readonly __brand: unique symbol }
export type MandatoryChar = string & { readonly __brand: unique symbol }
export type ValidWord = string & { readonly __brand: unique symbol }

/**
 * Creates a branded WordSize from a validated number.
 * Pure function with referential transparency.
 *
 * @param value - Validated integer between 4 and 9.
 * @returns Nominal WordSize branded value.
 * @example
 * ```ts
 * const size = toWordSize(4)
 * ```
 */
export function toWordSize(value: number): WordSize {
  if (!Number.isInteger(value) || value < 4 || value > 9) {
    throw new RangeError("Word size must be an integer between 4 and 9.")
  }
  return value as WordSize
}

/**
 * Creates a branded LetterPool from a validated string.
 * Pure function with referential transparency.
 *
 * @param value - Validated string of 4-9 unique lowercase letters.
 * @returns Nominal LetterPool branded value.
 * @example
 * ```ts
 * const pool = toLetterPool("cadevrsoi")
 * ```
 */
export function toLetterPool(value: string): LetterPool {
  if (typeof value !== "string") {
    throw new TypeError("Letter pool must be a string.")
  }

  const trimmed = value.trim()
  if (trimmed.length < 4 || trimmed.length > 9) {
    throw new RangeError("Letter pool must contain between 4 and 9 letters.")
  }

  if (!/^[a-z]+$/.test(trimmed)) {
    throw new TypeError(
      "Letter pool must contain only lowercase ASCII letters (a-z).",
    )
  }

  if (new Set(trimmed).size !== trimmed.length) {
    throw new RangeError("Letter pool must not contain duplicate letters.")
  }

  return trimmed as LetterPool
}

/**
 * Creates a branded MandatoryChar from a validated character.
 * Pure function with referential transparency.
 *
 * @param value - Validated single character string.
 * @returns Nominal MandatoryChar branded value.
 * @example
 * ```ts
 * const mandatory = toMandatoryChar("c")
 * ```
 */
export function toMandatoryChar(value: string): MandatoryChar {
  if (
    typeof value !== "string" ||
    value.length !== 1 ||
    !/^[a-z]$/.test(value)
  ) {
    throw new TypeError(
      "Mandatory character must be a single lowercase ASCII letter.",
    )
  }

  return value as MandatoryChar
}

/**
 * Creates a branded ValidWord from a matching word string.
 * Pure function with referential transparency.
 *
 * @param value - Matching word from dictionary.
 * @returns Nominal ValidWord branded value.
 * @example
 * ```ts
 * const word = toValidWord("discover")
 * ```
 */
export function toValidWord(value: string): ValidWord {
  if (typeof value !== "string" || value.length === 0) {
    throw new TypeError("Valid word must be a non-empty string.")
  }

  if (!/^[a-z]+$/.test(value)) {
    throw new TypeError("Valid word must contain only lowercase ASCII letters.")
  }

  return value as ValidWord
}

/**
 * Raw input contract for building a puzzle.
 */
export interface CreatePuzzleParams {
  readonly size: WordSize
  readonly mandatory: MandatoryChar
  readonly letters: LetterPool
  readonly dictionary: string
  readonly repeats: boolean
}

/**
 * Represents the validated, normalized word puzzle input contract.
 */
export interface Puzzle {
  readonly size: WordSize
  readonly mandatory: MandatoryChar
  readonly letters: LetterPool
  readonly dictionary: string
  readonly repeats: boolean
}

/**
 * Creates an immutable Puzzle configuration record.
 * Pure function with referential transparency.
 *
 * @param params - Validated puzzle parameters.
 * @returns Immutable Puzzle instance.
 * @example
 * ```ts
 * const puzzle = createPuzzle({
 *   size: toWordSize(4),
 *   mandatory: toMandatoryChar("c"),
 *   letters: toLetterPool("cadevrsoi"),
 *   dictionary: "dictionary",
 *   repeats: false,
 * })
 * ```
 */
export function createPuzzle(params: CreatePuzzleParams): Puzzle {
  const size = toWordSize(params.size)
  const mandatory = toMandatoryChar(params.mandatory)
  const letters = toLetterPool(params.letters)

  if (mandatory !== letters[0]) {
    throw new RangeError(
      "Mandatory character must be the first letter in the letter pool.",
    )
  }

  return Object.freeze({
    size,
    mandatory,
    letters,
    dictionary: params.dictionary.trim() || "dictionary",
    repeats: params.repeats,
  })
}

/**
 * Explains why a puzzle configuration or input payload failed domain
 * validation. Each member captures a specific error category and the
 * contextual data needed to explain the failure to callers or to report it
 * in logs.
 */
export type ValidationError =
  | {
      /** Word size was outside the permitted range for a puzzle. */
      readonly type: "invalid_size"
      readonly min: number
      readonly max: number
      readonly actual: number
    }
  | {
      /** The letter pool was malformed or contained invalid characters. */
      readonly type: "invalid_letters"
      readonly actual: string
      readonly reason: string
    }
  | {
      /** A required letter was missing from the provided puzzle input. */
      readonly type: "missing_letters"
    }
  | {
      /** A puzzle invariant was violated after validation and normalization. */
      readonly type: "invalid_puzzle"
      readonly detail: string
    }
  | {
      /**
       * An unexpected argument shape or unsupported input value was
       * supplied.
       */
      readonly type: "unexpected_argument"
      readonly detail: string
    }

/**
 * Represents the outcome of an operation that can succeed with a value or fail
 * with one or more domain-specific errors.
 */
export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly errors: readonly E[] }

/**
 * Constructs a successful Result containing a value.
 * Pure function with referential transparency.
 *
 * @template T - The success value type.
 * @template E - The error type.
 * @param value - The success value.
 * @returns Result with ok set to true and the value.
 * @example
 * ```ts
 * const res = ok(42)
 * ```
 */
export function ok<T, E = never>(value: T): Result<T, E> {
  return Object.freeze({ ok: true, value })
}

/**
 * Constructs a failed Result containing an array of errors.
 * Pure function with referential transparency.
 *
 * @template T - The success value type.
 * @template E - The error type.
 * @param errors - Non-empty collection of validation errors.
 * @returns Result with ok set to false and accumulated errors.
 * @example
 * ```ts
 * const res = err([{ type: "missing_letters" }])
 * ```
 */
export function err<T = never, E = ValidationError>(
  errors: readonly E[],
): Result<T, E> {
  return Object.freeze({ ok: false, errors: Object.freeze([...errors]) })
}

/**
 * Asserts unreachable state for exhaustive pattern matching.
 *
 * @param x - Value expected to be of type never.
 * @returns Never returns; throws an Error unconditionally.
 * @example
 * ```ts
 * default:
 *   return assertNever(variant)
 * ```
 */
export function assertNever(x: never): never {
  throw new Error(`Unexpected object: ${JSON.stringify(x)}`)
}
