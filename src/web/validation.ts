/**
 * Pure applicative validation and input sanitization for web puzzle forms.
 */

import {
  Puzzle,
  Result,
  ValidationError,
  createPuzzle,
  err,
  ok,
  toLetterPool,
  toMandatoryChar,
  toWordSize,
} from "../domain.js"

/**
 * Raw string form input state representing user entries before validation.
 */
export interface FormState {
  readonly mandatory: string
  readonly otherLetters: string
  readonly size: string
  readonly repeats: boolean
}

/**
 * Default initial state for form inputs.
 * Pre-populates size to "4" and repeats to true (Spelling Bee mode).
 */
export const initialForm: FormState = Object.freeze({
  mandatory: "",
  otherLetters: "",
  size: "4",
  repeats: true,
})

/**
 * Sanitizes raw string input by converting to lowercase, keeping only lowercase
 * ASCII letters (a-z), and capping at the specified length.
 * Pure function with referential transparency.
 *
 * @param limit - Maximum allowed character length.
 * @param raw - Raw input string to sanitize.
 * @returns Sanitized lowercase string capped at limit.
 * @example
 * ```ts
 * lowerLetters(1, "C") // "c"
 * lowerLetters(8, "a1b2c!") // "abc"
 * ```
 */
export function lowerLetters(limit: number, raw: string): string {
  const filtered = raw
    .toLowerCase()
    .split("")
    .filter((char) => char >= "a" && char <= "z")
    .join("")

  return filtered.slice(0, Math.max(0, limit))
}

/**
 * Sanitizes numeric size input by keeping only digit characters and capping
 * at two digits.
 * Pure function with referential transparency.
 *
 * @param raw - Raw input string to sanitize.
 * @returns Digit-only string capped at length 2.
 * @example
 * ```ts
 * sanitizeSizeInput("4a") // "4"
 * sanitizeSizeInput("123") // "12"
 * ```
 */
export function sanitizeSizeInput(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  return digits.slice(0, 2)
}

/**
 * Identifies whether a validation error pertains to the mandatory letter field.
 * Pure function with referential transparency.
 *
 * @param error - The validation error variant to test.
 * @returns True if error affects the mandatory letter input control.
 */
export function affectsMandatory(error: ValidationError): boolean {
  return (
    error.type === "missing_mandatory" || error.type === "invalid_mandatory"
  )
}

/**
 * Identifies whether a validation error pertains to the other letters field.
 * Pure function with referential transparency.
 *
 * @param error - The validation error variant to test.
 * @returns True if error affects the other letters input control.
 */
export function affectsOtherLetters(error: ValidationError): boolean {
  return error.type === "missing_letters" || error.type === "invalid_letters"
}

/**
 * Identifies whether a validation error pertains to the word size field.
 * Pure function with referential transparency.
 *
 * @param error - The validation error variant to test.
 * @returns True if error affects the word size input control.
 */
export function affectsSize(error: ValidationError): boolean {
  return error.type === "invalid_size"
}

/**
 * Validates web form inputs using applicative error accumulation.
 * Evaluates mandatory letter, other letters, and word size independently, then
 * checks cross-field disjointness.
 * Pure function with referential transparency.
 *
 * @param form - Form input state containing raw strings.
 * @returns Result containing a validated Puzzle or accumulated errors.
 * @example
 * ```ts
 * const res = validateWebForm({
 *   mandatory: "c",
 *   otherLetters: "adevrsoi",
 *   size: "7",
 *   repeats: false,
 * })
 * ```
 */
export function validateWebForm(
  form: FormState,
): Result<Puzzle, ValidationError> {
  const errors: ValidationError[] = []

  // 1. Mandatory letter validation
  const mandTrimmed = form.mandatory.trim()
  let validMandatory: string | undefined

  if (mandTrimmed.length === 0) {
    errors.push({ type: "missing_mandatory" })
  } else if (mandTrimmed.length !== 1 || !/^[a-z]$/.test(mandTrimmed)) {
    errors.push({
      type: "invalid_mandatory",
      actual: mandTrimmed,
    })
  } else {
    validMandatory = mandTrimmed
  }

  // 2. Other letters validation
  const othersTrimmed = form.otherLetters.trim()
  let validOthers: string | undefined

  if (othersTrimmed.length === 0) {
    errors.push({ type: "missing_letters" })
  } else if (!/^[a-z]+$/.test(othersTrimmed)) {
    errors.push({
      type: "invalid_letters",
      actual: othersTrimmed,
      reason: "Letters must only contain lowercase ASCII characters (a-z).",
    })
  } else if (othersTrimmed.length < 3 || othersTrimmed.length > 8) {
    errors.push({
      type: "invalid_letters",
      actual: othersTrimmed,
      reason: "Other letters must contain between 3 and 8 characters.",
    })
  } else if (new Set(othersTrimmed).size !== othersTrimmed.length) {
    errors.push({
      type: "invalid_letters",
      actual: othersTrimmed,
      reason: "Other letters must not contain duplicate characters.",
    })
  } else {
    validOthers = othersTrimmed
  }

  // 3. Cross-field disjointness check
  if (
    validMandatory !== undefined &&
    validOthers !== undefined &&
    validOthers.includes(validMandatory)
  ) {
    errors.push({
      type: "invalid_letters",
      actual: validOthers,
      reason: "Mandatory letter cannot be repeated in other letters.",
    })
  }

  // 4. Word size validation
  const sizeTrimmed = form.size.trim()
  let validSize = 4

  if (sizeTrimmed.length > 0) {
    const parsed = Number(sizeTrimmed)
    if (
      !Number.isInteger(parsed) ||
      Number.isNaN(parsed) ||
      parsed < 4 ||
      parsed > 9
    ) {
      errors.push({
        type: "invalid_size",
        min: 4,
        max: 9,
        actual: parsed,
      })
    } else {
      validSize = parsed
    }
  }

  if (errors.length > 0) {
    return err(errors)
  }

  if (validMandatory === undefined || validOthers === undefined) {
    return err([
      {
        type: "invalid_puzzle",
        detail: "Form inputs were incomplete.",
      },
    ])
  }

  const combinedPool = validMandatory + validOthers

  try {
    const puzzle = createPuzzle({
      size: toWordSize(validSize),
      mandatory: toMandatoryChar(validMandatory),
      letters: toLetterPool(combinedPool),
      dictionary: "dictionary",
      repeats: form.repeats,
    })
    return ok(puzzle)
  } catch {
    return err([
      {
        type: "invalid_puzzle",
        detail: "Combined letters pool violated domain invariants.",
      },
    ])
  }
}
