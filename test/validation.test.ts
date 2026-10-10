import { describe, expect, it } from "vitest"
import {
  formatValidationError,
  validateCliArgs,
  validateLetters,
  validateWordSize,
} from "../src/validation.js"

describe("applicative validation", (): void => {
  it("validates valid word sizes", (): void => {
    const res4 = validateWordSize(4)
    const res9 = validateWordSize(9)
    const resString = validateWordSize("7")
    const resDefault = validateWordSize(undefined)

    expect(res4.ok && res4.value).toBe(4)
    expect(res9.ok && res9.value).toBe(9)
    expect(resString.ok && resString.value).toBe(7)
    expect(resDefault.ok && resDefault.value).toBe(4)
  })

  it("rejects invalid word sizes", (): void => {
    const resTooSmall = validateWordSize(3)
    const resTooLarge = validateWordSize(10)
    const resNotInt = validateWordSize(5.5)
    const resInvalidStr = validateWordSize("abc")

    expect(resTooSmall.ok).toBe(false)
    expect(resTooLarge.ok).toBe(false)
    expect(resNotInt.ok).toBe(false)
    expect(resInvalidStr.ok).toBe(false)
  })

  it("validates valid letter pools", (): void => {
    const res = validateLetters("cadevrsoi")
    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.value.letters).toBe("cadevrsoi")
      expect(res.value.mandatory).toBe("c")
    }
  })

  it("rejects missing letter pool", (): void => {
    const resUndefined = validateLetters(undefined)
    const resEmpty = validateLetters("")

    expect(resUndefined.ok).toBe(false)
    expect(resEmpty.ok).toBe(false)
  })

  it("rejects invalid letters (case, length, duplicates)", (): void => {
    const resUpper = validateLetters("Cadevrsoi")
    const resShort = validateLetters("abc")
    const resLong = validateLetters("abcdefghijk")
    const resDuplicate = validateLetters("caadevrso")

    expect(resUpper.ok).toBe(false)
    expect(resShort.ok).toBe(false)
    expect(resLong.ok).toBe(false)
    expect(resDuplicate.ok).toBe(false)
  })

  it("accumulates multiple validation errors simultaneously", (): void => {
    const res = validateCliArgs({
      size: 2,
      letters: "abc",
    })

    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.errors.length).toBeGreaterThanOrEqual(2)
      const types = res.errors.map((e) => e.type)
      expect(types).toContain("invalid_size")
      expect(types).toContain("invalid_letters")
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

    expect(msgSize).toContain("Invalid size '2'")
    expect(msgLetters).toContain("Invalid letters 'abc'")
    expect(msgMissing).toContain("Missing required option")
    expect(msgUnexpected).toContain("Unexpected argument: --unknown")
  })
})
