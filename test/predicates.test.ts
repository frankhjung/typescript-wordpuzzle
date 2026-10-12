import { describe, expect, it } from "vitest"
import { matchesPuzzle } from "../src/predicates.js"
import {
  createPuzzle,
  toLetterPool,
  toMandatoryChar,
  toWordSize,
} from "../src/domain.js"

describe("predicate combinators", (): void => {
  const samplePuzzle = createPuzzle({
    size: toWordSize(7),
    mandatory: toMandatoryChar("c"),
    letters: toLetterPool("cadevrsoi"),
    dictionary: "dictionary",
    repeats: false,
  })

  const spellingBeePuzzle = createPuzzle({
    size: toWordSize(4),
    mandatory: toMandatoryChar("m"),
    letters: toLetterPool("mitncao"),
    dictionary: "dictionary",
    repeats: true,
  })

  it("evaluates 9-letter constraints through matchesPuzzle", (): void => {
    expect(matchesPuzzle(samplePuzzle, "discover")).toBe(true)
    expect(matchesPuzzle(samplePuzzle, "code")).toBe(false)
    expect(matchesPuzzle(samplePuzzle, "adverse")).toBe(false)
    expect(matchesPuzzle(samplePuzzle, "covaries")).toBe(true)
    expect(matchesPuzzle(samplePuzzle, "cocoon")).toBe(false)
  })

  it("evaluates repeat-mode constraints through matchesPuzzle", (): void => {
    expect(matchesPuzzle(spellingBeePuzzle, "commotion")).toBe(true)
    expect(matchesPuzzle(spellingBeePuzzle, "contain")).toBe(false)
    expect(matchesPuzzle(spellingBeePuzzle, "cat")).toBe(false)
  })

  it("remains total and non-throwing for arbitrary words", (): void => {
    expect((): boolean => matchesPuzzle(samplePuzzle, "")).not.toThrow()
    expect((): boolean => matchesPuzzle(samplePuzzle, "Ωmega")).not.toThrow()
    expect((): boolean =>
      matchesPuzzle(spellingBeePuzzle, "a\nb\tc"),
    ).not.toThrow()
  })
})
