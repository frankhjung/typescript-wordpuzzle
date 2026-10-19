/**
 * In-memory word puzzle solver and word length grouping logic.
 */

import { Puzzle } from "../domain.js"
import { matchesPuzzle } from "../predicates.js"

/**
 * A group of valid words sharing an identical character length.
 */
export interface WordGroup {
  readonly length: number
  readonly words: readonly string[]
}

/**
 * Groups an array of words by character length in descending order, with words
 * within each group sorted in ascending alphabetical order.
 * Pure function with referential transparency.
 *
 * @param words - Collection of valid words to group.
 * @returns Array of WordGroup records sorted by length descending.
 * @example
 * ```ts
 * const groups = groupWordsByLength(["discover", "sidecar", "divorce"])
 * ```
 */
export function groupWordsByLength(
  words: readonly string[],
): readonly WordGroup[] {
  const buckets = new Map<number, string[]>()

  for (const word of words) {
    const len = word.length
    const existing = buckets.get(len)
    if (existing !== undefined) {
      existing.push(word)
    } else {
      buckets.set(len, [word])
    }
  }

  const sortedLengths = Array.from(buckets.keys()).sort((a, b) => b - a)

  return Object.freeze(
    sortedLengths.map((len) => {
      const groupWords = buckets.get(len) ?? []
      return Object.freeze({
        length: len,
        words: Object.freeze(
          [...groupWords].sort((a, b) => a.localeCompare(b)),
        ),
      })
    }),
  )
}

/**
 * Solves a puzzle against an in-memory iterable of candidate dictionary words,
 * returning matching words grouped by length descending and sorted
 * alphabetically.
 * Pure function with referential transparency.
 *
 * @param puzzle - Validated puzzle domain model.
 * @param words - Iterable source of candidate dictionary words.
 * @returns Array of WordGroup records matching puzzle constraints.
 * @example
 * ```ts
 * const groups = solveWords(puzzle, ["care", "race", "cat"])
 * ```
 */
export function solveWords(
  puzzle: Puzzle,
  words: Iterable<string>,
): readonly WordGroup[] {
  const matched: string[] = []

  for (const rawWord of words) {
    const word = rawWord.trim()
    if (word.length > 0 && matchesPuzzle(puzzle, word)) {
      matched.push(word)
    }
  }

  return groupWordsByLength(matched)
}
