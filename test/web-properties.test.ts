import * as fc from "fast-check"
import { describe, it } from "vitest"
import {
  createPuzzle,
  toLetterPool,
  toMandatoryChar,
  toWordSize,
} from "../src/domain.js"
import { matchesPuzzle } from "../src/predicates.js"
import { groupWordsByLength, solveWords } from "../src/web/solver.js"

describe("web solver property-based testing", () => {
  it("preserves group length descending order and alphabetical sort", () => {
    fc.assert(
      fc.property(
        fc.array(fc.stringMatching(/^[a-z]{1,15}$/), {
          minLength: 0,
          maxLength: 50,
        }),
        (words) => {
          const groups = groupWordsByLength(words)

          // 1. Group lengths must be strictly monotonically decreasing
          for (let i = 0; i < groups.length - 1; i++) {
            const current = groups[i]
            const next = groups[i + 1]
            if (current !== undefined && next !== undefined) {
              if (current.length <= next.length) {
                return false
              }
            }
          }

          // 2. Words in each group must be monotonically non-decreasing
          for (const group of groups) {
            for (let j = 0; j < group.words.length - 1; j++) {
              const w1 = group.words[j]
              const w2 = group.words[j + 1]
              if (w1 !== undefined && w2 !== undefined) {
                if (w1.localeCompare(w2) > 0) {
                  return false
                }
              }
            }
          }

          // 3. Total grouped words equals input words count
          const totalGrouped = groups.reduce(
            (acc, g) => acc + g.words.length,
            0,
          )
          return totalGrouped === words.length
        },
      ),
    )
  })

  it("guarantees every solution word strictly satisfies puzzle rules", () => {
    // Generate distinct letter pool between 4 and 9 lowercase letters
    const poolArbitrary = fc
      .shuffledSubarray("abcdefghijklmnopqrstuvwxyz".split(""), {
        minLength: 4,
        maxLength: 9,
      })
      .map((chars) => chars.join(""))

    fc.assert(
      fc.property(
        poolArbitrary,
        fc.integer({ min: 4, max: 9 }),
        fc.boolean(),
        fc.array(fc.stringMatching(/^[a-z]{1,12}$/), {
          minLength: 0,
          maxLength: 40,
        }),
        (pool, size, repeats, candidateWords) => {
          const mandatory = pool.charAt(0)
          const puzzle = createPuzzle({
            size: toWordSize(size),
            mandatory: toMandatoryChar(mandatory),
            letters: toLetterPool(pool),
            dictionary: "dictionary",
            repeats,
          })

          const groups = solveWords(puzzle, candidateWords)

          for (const group of groups) {
            for (const word of group.words) {
              // Word must match puzzle predicate
              if (!matchesPuzzle(puzzle, word)) {
                return false
              }
              // Word must contain mandatory character
              if (!word.includes(mandatory)) {
                return false
              }
              // Length must match group length
              if (word.length !== group.length) {
                return false
              }
              // Length must be at least puzzle size
              if (word.length < size) {
                return false
              }
              // In 9-letter mode, no duplicates and max length 9
              if (!repeats) {
                if (word.length > 9) {
                  return false
                }
                if (new Set(word).size !== word.length) {
                  return false
                }
              }
            }
          }

          return true
        },
      ),
    )
  })
})
