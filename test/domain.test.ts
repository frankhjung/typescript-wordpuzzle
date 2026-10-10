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
