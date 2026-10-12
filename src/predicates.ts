/**
 * Pure matching rules for 9-letter word puzzles and Spelling Bee mode.
 * Internal rule helpers compose into the public `matchesPuzzle` matcher.
 */

import { Puzzle } from "./domain.js"

/**
 * Verifies that a word satisfies minimum and optional maximum length limits.
 * Pure function with referential transparency.
 */
function checkLength(
  min: number,
  max: number | undefined,
  word: string,
): boolean {
  return word.length >= min && (max === undefined || word.length <= max)
}

/**
 * Verifies that a word contains the mandatory character.
 * Pure function with referential transparency.
 */
function hasMandatory(mandatory: string, word: string): boolean {
  return word.includes(mandatory)
}

/**
 * Verifies that all characters in a word belong to the allowed letter pool.
 * Pure function with referential transparency.
 */
function hasOnlyLetters(letters: string, word: string): boolean {
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
 */
function hasNoDuplicates(word: string): boolean {
  return new Set(word).size === word.length
}

/**
 * Evaluates whether a word matches 9-letter word puzzle constraints.
 * Pure function with referential transparency.
 */
function nineLetters(puzzle: Puzzle, word: string): boolean {
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
 */
function spellingBee(puzzle: Puzzle, word: string): boolean {
  return (
    checkLength(puzzle.size, undefined, word) &&
    hasMandatory(puzzle.mandatory, word) &&
    hasOnlyLetters(puzzle.letters, word)
  )
}

/**
 * Evaluates whether a word matches the puzzle rules based on repeat mode.
 * Pure function with referential transparency.
 * This function is total and never throws; failures are represented as false.
 * Evaluation order is deterministic and short-circuits left-to-right through
 * the selected rule chain.
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
