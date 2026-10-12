import { describe, expect, it } from "vitest"
import {
  assertNever,
  createPuzzle,
  err,
  ok,
  toLetterPool,
  toMandatoryChar,
  toWordSize,
  ValidationError,
} from "../src/domain.js"

describe("domain models and constructors", (): void => {
  it("creates branded nominal types accurately", (): void => {
    const size = toWordSize(7)
    const pool = toLetterPool("cadevrsoi")
    const mandatory = toMandatoryChar("c")

    expect(size).toBe(7)
    expect(pool).toBe("cadevrsoi")
    expect(mandatory).toBe("c")
  })

  it("freezes and constructs a Puzzle record", (): void => {
    const puzzle = createPuzzle({
      size: toWordSize(4),
      mandatory: toMandatoryChar("c"),
      letters: toLetterPool("cadevrsoi"),
      dictionary: "dictionary",
      repeats: false,
    })

    expect(puzzle.size).toBe(4)
    expect(puzzle.mandatory).toBe("c")
    expect(puzzle.letters).toBe("cadevrsoi")
    expect(puzzle.repeats).toBe(false)
    expect(Object.isFrozen(puzzle)).toBe(true)
  })

  it("rejects invalid branded constructors", (): void => {
    expect((): void => {
      toWordSize(3)
    }).toThrow(/between 4 and 9/)
    expect((): void => {
      toLetterPool("abc")
    }).toThrow(/between 4 and 9/)
    expect((): void => {
      toMandatoryChar("ab")
    }).toThrow(/single lowercase/)
    expect((): void => {
      createPuzzle({
        size: toWordSize(7),
        mandatory: toMandatoryChar("d"),
        letters: toLetterPool("cadevrsoi"),
        dictionary: "dictionary",
        repeats: false,
      })
    }).toThrow(/first letter in the letter pool/)
  })

  it("constructs success and failure Result values", (): void => {
    const successResult = ok(123)
    const failureResult = err<number, ValidationError>([
      { type: "missing_letters" },
    ])

    expect(successResult.ok).toBe(true)
    if (successResult.ok) {
      expect(successResult.value).toBe(123)
    }

    expect(failureResult.ok).toBe(false)
    if (!failureResult.ok) {
      expect(failureResult.errors).toHaveLength(1)
      expect(failureResult.errors[0]?.type).toBe("missing_letters")
    }
  })

  it("throws in assertNever when unexpected variant is received", (): void => {
    expect((): void => {
      // Cast to test runtime behaviour of unreachable branch
      const invalid = "unknown" as never
      assertNever(invalid)
    }).toThrow("Unexpected object")
  })
})
