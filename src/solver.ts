/**
 * Lazy asynchronous streaming solver filtering dictionary candidate words.
 */

import { Puzzle, ValidWord, toValidWord } from "./domain.js"
import { matchesPuzzle } from "./predicates.js"

/**
 * Lazily filters candidate dictionary words matching puzzle constraints.
 * Pure async generator with referential transparency over the input stream.
 *
 * @param puzzle - Validated puzzle configuration.
 * @param lines - Asynchronous iterable stream of dictionary lines; each line is
 *   trimmed but otherwise matched exactly as supplied.
 * @returns Asynchronous iterable yielding valid matching words.
 * @example
 * ```ts
 * for await (const match of solve(puzzle, lineStream)) {
 *   console.log(match)
 * }
 * ```
 */
export async function* solve(
  puzzle: Puzzle,
  lines: AsyncIterable<string>,
): AsyncIterable<ValidWord> {
  for await (const rawLine of lines) {
    const word = rawLine.trim()
    if (word.length > 0 && matchesPuzzle(puzzle, word)) {
      yield toValidWord(word)
    }
  }
}
