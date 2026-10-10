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
  return value as LetterPool
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
  return value as ValidWord
}

export interface Puzzle {
  readonly size: WordSize
  readonly mandatory: MandatoryChar
  readonly letters: LetterPool
  readonly dictionary: string
  readonly repeats: boolean
}

export interface CreatePuzzleParams {
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
  return Object.freeze({
    size: params.size,
    mandatory: params.mandatory,
    letters: params.letters,
    dictionary: params.dictionary,
    repeats: params.repeats,
  })
}

export type ValidationError =
  | {
      readonly type: "invalid_size"
      readonly min: number
      readonly max: number
      readonly actual: number
    }
  | {
      readonly type: "invalid_letters"
      readonly actual: string
      readonly reason: string
    }
  | { readonly type: "missing_letters" }
  | { readonly type: "unexpected_argument"; readonly detail: string }

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
