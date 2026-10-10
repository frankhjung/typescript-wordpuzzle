/**
 * Pure predicate combinators for 9-letter word puzzles and Spelling Bee rules.
 */

import { Puzzle } from "./domain.js"

/**
 * Verifies that a word satisfies minimum and optional maximum length limits.
 * Pure function with referential transparency.
 *
 * @param min - Minimum allowed word length.
 * @param max - Maximum allowed word length, or undefined if unbounded.
 * @param word - Word to test.
 * @returns True if word length is within bounds, false otherwise.
 * @example
 * ```ts
 * checkLength(4, 9, "discover") // true
 * ```
 */
export function checkLength(
  min: number,
  max: number | undefined,
  word: string,
): boolean {
  return word.length >= min && (max === undefined || word.length <= max)
}

/**
 * Verifies that a word contains the mandatory character.
 * Pure function with referential transparency.
 *
 * @param mandatory - The mandatory character.
 * @param word - Word to test.
 * @returns True if word contains mandatory character, false otherwise.
 * @example
 * ```ts
 * hasMandatory("c", "discover") // true
 * ```
 */
export function hasMandatory(mandatory: string, word: string): boolean {
  return word.includes(mandatory)
}

/**
 * Verifies that all characters in a word belong to the allowed letter pool.
 * Pure function with referential transparency.
 *
 * @param letters - Allowed letter pool string.
 * @param word - Word to test.
 * @returns True if every character in word exists in letters, false otherwise.
 * @example
 * ```ts
 * hasOnlyLetters("cadevrsoi", "discover") // true
 * ```
 */
export function hasOnlyLetters(letters: string, word: string): boolean {
  for (const char of word) {
    if (!letters.includes(char)) {
      return false
    }
  }
  return true
}

/**
 * Verifies that a word contains no duplicate characters.
 * Pure function with referential transparency.
 *
 * @param word - Word to test.
 * @returns True if all characters in word are unique, false otherwise.
 * @example
 * ```ts
 * hasNoDuplicates("discover") // true
 * ```
 */
export function hasNoDuplicates(word: string): boolean {
  return new Set(word).size === word.length
}

/**
 * Evaluates whether a word matches 9-letter word puzzle constraints.
 * Pure function with referential transparency.
 *
 * @param puzzle - Validated puzzle configuration.
 * @param word - Candidate word to test.
 * @returns True if word satisfies all 9-letter rules, false otherwise.
 * @example
 * ```ts
 * nineLetters(puzzle, "discover")
 * ```
 */
export function nineLetters(puzzle: Puzzle, word: string): boolean {
  return (
    checkLength(puzzle.size, 9, word) &&
    hasMandatory(puzzle.mandatory, word) &&
    hasNoDuplicates(word) &&
    hasOnlyLetters(puzzle.letters, word)
  )
}

/**
 * Evaluates whether a word matches Spelling Bee (repeats allowed) constraints.
 * Pure function with referential transparency.
 *
 * @param puzzle - Validated puzzle configuration.
 * @param word - Candidate word to test.
 * @returns True if word satisfies all Spelling Bee rules, false otherwise.
 * @example
 * ```ts
 * spellingBee(puzzle, "action")
 * ```
 */
export function spellingBee(puzzle: Puzzle, word: string): boolean {
  return (
    checkLength(puzzle.size, undefined, word) &&
    hasMandatory(puzzle.mandatory, word) &&
    hasOnlyLetters(puzzle.letters, word)
  )
}

/**
 * Evaluates whether a word matches the puzzle rules based on repeat mode.
 * Pure function with referential transparency.
 *
 * @param puzzle - Validated puzzle configuration.
 * @param word - Candidate word to test.
 * @returns True if word satisfies the puzzle constraints, false otherwise.
 * @example
 * ```ts
 * matchesPuzzle(puzzle, "discover")
 * ```
 */
export function matchesPuzzle(puzzle: Puzzle, word: string): boolean {
  return puzzle.repeats ? spellingBee(puzzle, word) : nineLetters(puzzle, word)
}
