import { describe, expect, it } from "vitest"
import {
  createPuzzle,
  toLetterPool,
  toMandatoryChar,
  toWordSize,
} from "../src/domain.js"
import { initialModel, update } from "../src/web/model.js"
import { groupWordsByLength, solveWords } from "../src/web/solver.js"

describe("groupWordsByLength", () => {
  it("returns empty array when given no words", () => {
    expect(groupWordsByLength([])).toEqual([])
  })

  it("groups words by length descending and sorts words alphabetically", () => {
    const input = [
      "sidecar",
      "discover",
      "viscera",
      "divorces",
      "divorce",
      "varicose",
    ]

    const groups = groupWordsByLength(input)

    expect(groups).toHaveLength(2)
    expect(groups[0]?.length).toBe(8)
    expect(groups[0]?.words).toEqual(["discover", "divorces", "varicose"])
    expect(groups[1]?.length).toBe(7)
    expect(groups[1]?.words).toEqual(["divorce", "sidecar", "viscera"])
  })
})

describe("solveWords", () => {
  const dictionary = [
    "cat",
    "care",
    "race",
    "discover",
    "divorce",
    "divorces",
    "sidecar",
    "varicose",
    "viscera",
    "discard",
    "nomatch",
  ]

  it("solves 9-letter puzzles without repeated letters", () => {
    const puzzle = createPuzzle({
      size: toWordSize(7),
      mandatory: toMandatoryChar("c"),
      letters: toLetterPool("cadevrsoi"),
      dictionary: "dictionary",
      repeats: false,
    })

    const groups = solveWords(puzzle, dictionary)

    expect(groups).toHaveLength(2)
    expect(groups[0]?.length).toBe(8)
    expect(groups[0]?.words).toEqual(["discover", "divorces", "varicose"])
    expect(groups[1]?.length).toBe(7)
    expect(groups[1]?.words).toEqual(["divorce", "sidecar", "viscera"])
  })

  it("solves Spelling Bee puzzles allowing repeating letters", () => {
    const puzzle = createPuzzle({
      size: toWordSize(4),
      mandatory: toMandatoryChar("c"),
      letters: toLetterPool("care"),
      dictionary: "dictionary",
      repeats: true,
    })

    const words = ["care", "race", "carer", "carera", "rare", "cat"]
    const groups = solveWords(puzzle, words)

    const allWords = groups.flatMap((g) => g.words)
    expect(allWords).toContain("care")
    expect(allWords).toContain("race")
    expect(allWords).toContain("carer")
    expect(allWords).toContain("carera")
    expect(allWords).not.toContain("rare") // missing mandatory 'c'
    expect(allWords).not.toContain("cat") // 't' not in pool
  })

  it("returns empty array when no dictionary words match", () => {
    const puzzle = createPuzzle({
      size: toWordSize(4),
      mandatory: toMandatoryChar("z"),
      letters: toLetterPool("zabc"),
      dictionary: "dictionary",
      repeats: false,
    })

    expect(solveWords(puzzle, ["care", "race"])).toEqual([])
  })
})

describe("web state machine update reducer", () => {
  it("processes input changes and preserves outcome", () => {
    let model = initialModel
    expect(model.form.repeats).toBe(true)
    expect(model.form.size).toBe("4")

    model = update(model, { type: "set_mandatory", raw: "C" })
    expect(model.form.mandatory).toBe("c")
    expect(model.outcome.type).toBe("not_solved")

    model = update(model, {
      type: "set_other_letters",
      raw: "adevrsoi123",
    })
    expect(model.form.otherLetters).toBe("adevrsoi")

    model = update(model, { type: "set_size", raw: "7" })
    expect(model.form.size).toBe("7")

    model = update(model, { type: "toggle_repeats", enabled: false })
    expect(model.form.repeats).toBe(false)
  })

  it("handles dictionary load success and failure", () => {
    let model = initialModel

    model = update(model, {
      type: "got_dictionary_content",
      content: "discover\ndivorce\n",
    })
    expect(model.dictionary.type).toBe("success")
    if (model.dictionary.type === "success") {
      expect(model.dictionary.words).toEqual(["discover", "divorce"])
    }

    model = update(model, {
      type: "got_dictionary_failure",
      message: "Network Error",
    })
    expect(model.dictionary.type).toBe("failure")

    model = update(model, { type: "retry" })
    expect(model.dictionary.type).toBe("loading")
  })

  it("transitions to solved or invalid on submit", () => {
    let model = update(initialModel, {
      type: "got_dictionary_content",
      content: "discover\ndivorce\nsidecar\n",
    })

    model = update(model, { type: "set_mandatory", raw: "c" })
    model = update(model, { type: "set_other_letters", raw: "adevrsoi" })
    model = update(model, { type: "set_size", raw: "7" })
    model = update(model, { type: "toggle_repeats", enabled: false })

    const solvedModel = update(model, { type: "submit" })
    expect(solvedModel.outcome.type).toBe("solved")
    if (solvedModel.outcome.type === "solved") {
      expect(solvedModel.outcome.puzzle.mandatory).toBe("c")
      expect(solvedModel.outcome.groups).toHaveLength(2)
    }

    // Invalid submit
    const badFormModel = update(model, { type: "set_mandatory", raw: "" })
    const invalidModel = update(badFormModel, { type: "submit" })
    expect(invalidModel.outcome.type).toBe("invalid")
  })
})
