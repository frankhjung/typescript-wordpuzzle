import { describe, expect, it } from "vitest"
import { formatValidationError, validateCliArgs } from "../src/validation.js"

describe("applicative validation", (): void => {
  it("validates a complete and valid CLI argument set", (): void => {
    const res = validateCliArgs({
      size: "7",
      letters: "cadevrsoi",
      dictionary: "dictionary",
      repeats: false,
    })

    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.value.size).toBe(7)
      expect(res.value.letters).toBe("cadevrsoi")
      expect(res.value.mandatory).toBe("c")
      expect(res.value.dictionary).toBe("dictionary")
      expect(res.value.repeats).toBe(false)
    }
  })

  it("defaults optional size and dictionary values", (): void => {
    const res = validateCliArgs({
      letters: "cadevrsoi",
      dictionary: "   ",
    })

    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.value.size).toBe(4)
      expect(res.value.dictionary).toBe("dictionary")
    }
  })

  it("rejects invalid size values through the public validator", (): void => {
    const tooSmall = validateCliArgs({ size: 3, letters: "cadevrsoi" })
    const tooLarge = validateCliArgs({ size: 10, letters: "cadevrsoi" })
    const notInt = validateCliArgs({ size: 5.5, letters: "cadevrsoi" })
    const invalidString = validateCliArgs({ size: "abc", letters: "cadevrsoi" })

    expect(tooSmall.ok).toBe(false)
    expect(tooLarge.ok).toBe(false)
    expect(notInt.ok).toBe(false)
    expect(invalidString.ok).toBe(false)
  })

  it("rejects invalid letters through the public validator", (): void => {
    const missingUndefined = validateCliArgs({ size: 4 })
    const missingEmpty = validateCliArgs({ size: 4, letters: "" })
    const upper = validateCliArgs({ size: 4, letters: "Cadevrsoi" })
    const short = validateCliArgs({ size: 4, letters: "abc" })
    const long = validateCliArgs({ size: 4, letters: "abcdefghijk" })
    const duplicate = validateCliArgs({ size: 4, letters: "caadevrso" })

    expect(missingUndefined.ok).toBe(false)
    expect(missingEmpty.ok).toBe(false)
    expect(upper.ok).toBe(false)
    expect(short.ok).toBe(false)
    expect(long.ok).toBe(false)
    expect(duplicate.ok).toBe(false)
  })

  it("accumulates multiple validation errors simultaneously", (): void => {
    const res = validateCliArgs({
      size: 2,
      letters: "abc",
    })

    expect(res.ok).toBe(false)
    if (!res.ok) {
      const types = res.errors.map((e) => e.type)
      expect(types).toEqual(["invalid_size", "invalid_letters"])
    }
  })

  it("formats validation errors in Australian English", (): void => {
    const msgSize = formatValidationError({
      type: "invalid_size",
      min: 4,
      max: 9,
      actual: 2,
    })
    const msgLetters = formatValidationError({
      type: "invalid_letters",
      actual: "abc",
      reason: "Letters must contain between 4 and 9 characters.",
    })
    const msgMissing = formatValidationError({
      type: "missing_letters",
    })
    const msgUnexpected = formatValidationError({
      type: "unexpected_argument",
      detail: "--unknown",
    })
    const msgPuzzle = formatValidationError({
      type: "invalid_puzzle",
      detail: "Puzzle configuration violated domain invariants.",
    })
    const msgMandatoryMissing = formatValidationError({
      type: "missing_mandatory",
    })
    const msgMandatoryInvalid = formatValidationError({
      type: "invalid_mandatory",
      actual: "1",
    })

    expect(msgSize).toContain("Invalid size '2'")
    expect(msgLetters).toContain("Invalid letters 'abc'")
    expect(msgMissing).toContain("Missing required option")
    expect(msgPuzzle).toContain("Invalid puzzle configuration")
    expect(msgUnexpected).toContain("Unexpected argument: --unknown")
    expect(msgMandatoryMissing).toContain("Missing required mandatory letter")
    expect(msgMandatoryInvalid).toContain("Invalid mandatory letter '1'")
  })
})
