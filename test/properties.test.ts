import { describe, it } from "vitest"
import * as fc from "fast-check"
import {
  createPuzzle,
  Puzzle,
  toLetterPool,
  toMandatoryChar,
  toWordSize,
} from "../src/domain.js"
import { matchesPuzzle } from "../src/predicates.js"
import { validateCliArgs } from "../src/validation.js"

const alphabet = "abcdefghijklmnopqrstuvwxyz".split("")

const letterPoolArb = fc
  .shuffledSubarray(alphabet, { minLength: 4, maxLength: 9 })
  .map((chars: readonly string[]): string => chars.join(""))

const puzzleArb = fc
  .record({
    size: fc.integer({ min: 4, max: 9 }),
    letters: letterPoolArb,
    repeats: fc.boolean(),
  })
  .map((record): Puzzle =>
    createPuzzle({
      size: toWordSize(record.size),
      mandatory: toMandatoryChar(record.letters[0] ?? "a"),
      letters: toLetterPool(record.letters),
      dictionary: "dictionary",
      repeats: record.repeats,
    }),
  )

const candidateWordArb = fc.stringMatching(/^[a-z]{1,15}$/)

const nonRepeatPuzzleArb = puzzleArb.map((p): Puzzle =>
  createPuzzle({
    size: p.size,
    mandatory: p.mandatory,
    letters: p.letters,
    dictionary: p.dictionary,
    repeats: false,
  }),
)

const repeatPuzzleArb = puzzleArb.map((p): Puzzle =>
  createPuzzle({
    size: p.size,
    mandatory: p.mandatory,
    letters: p.letters,
    dictionary: p.dictionary,
    repeats: true,
  }),
)

describe("QuickCheck-style property invariants", (): void => {
  it("satisfies mandatory letter invariant for matching words", (): void => {
    fc.assert(
      fc.property(puzzleArb, candidateWordArb, (puzzle, word): boolean => {
        if (!matchesPuzzle(puzzle, word)) {
          return true
        }
        return word.includes(puzzle.mandatory)
      }),
      { numRuns: 1000 },
    )
  })

  it("satisfies alphabet invariant for matching words", (): void => {
    fc.assert(
      fc.property(puzzleArb, candidateWordArb, (puzzle, word): boolean => {
        if (!matchesPuzzle(puzzle, word)) {
          return true
        }
        for (let i = 0; i < word.length; i++) {
          const char = word[i]
          if (char === undefined || !puzzle.letters.includes(char)) {
            return false
          }
        }
        return true
      }),
      { numRuns: 1000 },
    )
  })

  it("satisfies no-duplicates invariant when repeats is false", (): void => {
    fc.assert(
      fc.property(
        nonRepeatPuzzleArb,
        candidateWordArb,
        (puzzle, word): boolean => {
          if (!matchesPuzzle(puzzle, word)) {
            return true
          }
          return new Set(word).size === word.length
        },
      ),
      { numRuns: 1000 },
    )
  })

  it("satisfies length bounds invariant when repeats is false", (): void => {
    fc.assert(
      fc.property(
        nonRepeatPuzzleArb,
        candidateWordArb,
        (puzzle, word): boolean => {
          if (!matchesPuzzle(puzzle, word)) {
            return true
          }
          return word.length >= puzzle.size && word.length <= 9
        },
      ),
      { numRuns: 1000 },
    )
  })

  it("satisfies minimum length invariant when repeats is true", (): void => {
    fc.assert(
      fc.property(
        repeatPuzzleArb,
        candidateWordArb,
        (puzzle, word): boolean => {
          if (!matchesPuzzle(puzzle, word)) {
            return true
          }
          return word.length >= puzzle.size
        },
      ),
      { numRuns: 1000 },
    )
  })

  it("satisfies validation idempotence round-trip", (): void => {
    fc.assert(
      fc.property(puzzleArb, (puzzle): boolean => {
        const validated = validateCliArgs({
          size: puzzle.size,
          letters: puzzle.letters,
          dictionary: puzzle.dictionary,
          repeats: puzzle.repeats,
        })

        if (!validated.ok) {
          return false
        }

        const res = validated.value
        return (
          res.size === puzzle.size &&
          res.letters === puzzle.letters &&
          res.mandatory === puzzle.mandatory &&
          res.repeats === puzzle.repeats
        )
      }),
      { numRuns: 1000 },
    )
  })
})
