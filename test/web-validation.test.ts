import { describe, expect, it } from "vitest"
import {
  affectsMandatory,
  affectsOtherLetters,
  affectsSize,
  initialForm,
  lowerLetters,
  sanitizeSizeInput,
  validateWebForm,
} from "../src/web/validation.js"

describe("web form input sanitization", () => {
  it("converts letters to lowercase and strips non-letters", () => {
    expect(lowerLetters(1, "C")).toBe("c")
    expect(lowerLetters(1, "123")).toBe("")
    expect(lowerLetters(8, "a1b2c!d")).toBe("abcd")
    expect(lowerLetters(5, "abcdefgh")).toBe("abcde")
    expect(lowerLetters(0, "abc")).toBe("")
  })

  it("sanitizes size input by keeping only digits up to length 2", () => {
    expect(sanitizeSizeInput("7")).toBe("7")
    expect(sanitizeSizeInput("4a")).toBe("4")
    expect(sanitizeSizeInput("123")).toBe("12")
    expect(sanitizeSizeInput("abc")).toBe("")
  })
})

describe("web form field predicates", () => {
  it("correlates error types to affected input controls", () => {
    expect(affectsMandatory({ type: "missing_mandatory" })).toBe(true)
    expect(affectsMandatory({ type: "invalid_mandatory", actual: "1" })).toBe(
      true,
    )
    expect(affectsMandatory({ type: "missing_letters" })).toBe(false)

    expect(affectsOtherLetters({ type: "missing_letters" })).toBe(true)
    expect(
      affectsOtherLetters({
        type: "invalid_letters",
        actual: "abc",
        reason: "too short",
      }),
    ).toBe(true)
    expect(affectsOtherLetters({ type: "missing_mandatory" })).toBe(false)

    expect(
      affectsSize({ type: "invalid_size", min: 4, max: 9, actual: 2 }),
    ).toBe(true)
    expect(affectsSize({ type: "missing_mandatory" })).toBe(false)
  })
})

describe("web form applicative validation", () => {
  it("validates a complete and valid form state", () => {
    const res = validateWebForm({
      mandatory: "c",
      otherLetters: "adevrsoi",
      size: "7",
      repeats: false,
    })

    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.value.mandatory).toBe("c")
      expect(res.value.letters).toBe("cadevrsoi")
      expect(res.value.size).toBe(7)
      expect(res.value.repeats).toBe(false)
    }
  })

  it("defaults empty size to 4", () => {
    const res = validateWebForm({
      mandatory: "c",
      otherLetters: "adevrsoi",
      size: "",
      repeats: true,
    })

    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.value.size).toBe(4)
      expect(res.value.repeats).toBe(true)
    }
  })

  it("rejects missing or invalid mandatory letter", () => {
    const missing = validateWebForm({
      ...initialForm,
      mandatory: "",
      otherLetters: "adevrsoi",
    })
    expect(missing.ok).toBe(false)
    if (!missing.ok) {
      expect(missing.errors.some((e) => e.type === "missing_mandatory")).toBe(
        true,
      )
    }

    const nonAlpha = validateWebForm({
      ...initialForm,
      mandatory: "1",
      otherLetters: "adevrsoi",
    })
    expect(nonAlpha.ok).toBe(false)
    if (!nonAlpha.ok) {
      expect(nonAlpha.errors.some((e) => e.type === "invalid_mandatory")).toBe(
        true,
      )
    }
  })

  it("rejects invalid other letters pool independently", () => {
    const emptyOthers = validateWebForm({
      mandatory: "c",
      otherLetters: "",
      size: "4",
      repeats: true,
    })
    expect(emptyOthers.ok).toBe(false)
    if (!emptyOthers.ok) {
      expect(emptyOthers.errors.some((e) => e.type === "missing_letters")).toBe(
        true,
      )
    }

    const shortOthers = validateWebForm({
      mandatory: "c",
      otherLetters: "ab",
      size: "4",
      repeats: true,
    })
    expect(shortOthers.ok).toBe(false)
    if (!shortOthers.ok) {
      expect(shortOthers.errors.some((e) => e.type === "invalid_letters")).toBe(
        true,
      )
    }

    const duplicateOthers = validateWebForm({
      mandatory: "c",
      otherLetters: "aab",
      size: "4",
      repeats: true,
    })
    expect(duplicateOthers.ok).toBe(false)
    if (!duplicateOthers.ok) {
      expect(
        duplicateOthers.errors.some((e) => e.type === "invalid_letters"),
      ).toBe(true)
    }
  })

  it("rejects when mandatory letter is repeated in other letters", () => {
    const res = validateWebForm({
      mandatory: "c",
      otherLetters: "cadevrso",
      size: "4",
      repeats: true,
    })

    expect(res.ok).toBe(false)
    if (!res.ok) {
      const err = res.errors.find((e) => e.type === "invalid_letters")
      expect(err).toBeDefined()
      if (err && err.type === "invalid_letters") {
        expect(err.reason).toContain("cannot be repeated")
      }
    }
  })

  it("rejects out-of-range word size", () => {
    const tooSmall = validateWebForm({
      mandatory: "c",
      otherLetters: "adevrsoi",
      size: "3",
      repeats: false,
    })
    expect(tooSmall.ok).toBe(false)
    if (!tooSmall.ok) {
      expect(tooSmall.errors.some((e) => e.type === "invalid_size")).toBe(true)
    }

    const tooLarge = validateWebForm({
      mandatory: "c",
      otherLetters: "adevrsoi",
      size: "10",
      repeats: false,
    })
    expect(tooLarge.ok).toBe(false)
    if (!tooLarge.ok) {
      expect(tooLarge.errors.some((e) => e.type === "invalid_size")).toBe(true)
    }
  })

  it("accumulates multiple errors across fields simultaneously", () => {
    const res = validateWebForm({
      mandatory: "",
      otherLetters: "a",
      size: "2",
      repeats: true,
    })

    expect(res.ok).toBe(false)
    if (!res.ok) {
      const types = res.errors.map((e) => e.type)
      expect(types).toContain("missing_mandatory")
      expect(types).toContain("invalid_letters")
      expect(types).toContain("invalid_size")
    }
  })
})
