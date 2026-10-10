import { describe, expect, it } from "vitest"
import {
  checkLength,
  hasMandatory,
  hasNoDuplicates,
  hasOnlyLetters,
  matchesPuzzle,
  nineLetters,
  spellingBee,
} from "../src/predicates.js"
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

  it("evaluates checkLength correctly", (): void => {
    expect(checkLength(4, 9, "cat")).toBe(false)
    expect(checkLength(4, 9, "card")).toBe(true)
    expect(checkLength(4, 9, "cadevrsoi")).toBe(true)
    expect(checkLength(4, 9, "extravagant")).toBe(false)
    expect(checkLength(4, undefined, "extravagant")).toBe(true)
  })

  it("evaluates hasMandatory accurately", (): void => {
    expect(hasMandatory("c", "cadevrsoi")).toBe(true)
    expect(hasMandatory("c", "adverse")).toBe(false)
  })

  it("evaluates hasOnlyLetters properly", (): void => {
    expect(hasOnlyLetters("cadevrsoi", "discover")).toBe(true)
    expect(hasOnlyLetters("cadevrsoi", "python")).toBe(false)
  })

  it("evaluates hasNoDuplicates strictly", (): void => {
    expect(hasNoDuplicates("discover")).toBe(true)
    expect(hasNoDuplicates("divorces")).toBe(true)
    expect(hasNoDuplicates("letters")).toBe(false)
  })

  it("evaluates nineLetters predicate constraints", (): void => {
    expect(nineLetters(samplePuzzle, "discover")).toBe(true)
    expect(nineLetters(samplePuzzle, "code")).toBe(false) // length < 7
    expect(nineLetters(samplePuzzle, "adverse")).toBe(false) // missing 'c'
    expect(nineLetters(samplePuzzle, "covaries")).toBe(true)
    expect(nineLetters(samplePuzzle, "cocoon")).toBe(false) // has duplicates
  })

  it("evaluates spellingBee predicate constraints", (): void => {
    expect(spellingBee(spellingBeePuzzle, "commotion")).toBe(true)
    // Missing 'm'
    expect(spellingBee(spellingBeePuzzle, "contain")).toBe(false)
    expect(spellingBee(spellingBeePuzzle, "cat")).toBe(false) // length < 4
  })

  it("dispatches matchesPuzzle based on repeat mode", (): void => {
    expect(matchesPuzzle(samplePuzzle, "discover")).toBe(true)
    expect(matchesPuzzle(samplePuzzle, "cocoon")).toBe(false)
    expect(matchesPuzzle(spellingBeePuzzle, "commotion")).toBe(true)
  })
})
