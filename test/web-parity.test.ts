import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  createPuzzle,
  toLetterPool,
  toMandatoryChar,
  toWordSize,
} from "../src/domain.js"
import { solve } from "../src/solver.js"
import { parseDictionary } from "../src/web/dictionary.js"
import { solveWords } from "../src/web/solver.js"

describe("web solver differential parity against CLI solver", () => {
  const dictPath = path.resolve(__dirname, "../dictionary")
  const dictContent = fs.readFileSync(dictPath, "utf8")
  const dictWords = parseDictionary(dictContent)

  async function collectCliWords(
    puzzle: ReturnType<typeof createPuzzle>,
  ): Promise<string[]> {
    async function* lineStream(): AsyncIterable<string> {
      for (const word of dictWords) {
        yield word
      }
    }

    const matches: string[] = []
    for await (const match of solve(puzzle, lineStream())) {
      matches.push(match)
    }
    return matches
  }

  it("yields identical matching words for 9-letter target puzzle", async () => {
    const puzzle = createPuzzle({
      size: toWordSize(7),
      mandatory: toMandatoryChar("c"),
      letters: toLetterPool("cadevrsoi"),
      dictionary: "dictionary",
      repeats: false,
    })

    const cliWords = await collectCliWords(puzzle)
    const webGroups = solveWords(puzzle, dictWords)
    const webWords = webGroups.flatMap((g) => g.words)

    expect([...cliWords].sort()).toEqual([...webWords].sort())
    expect(webWords).toEqual([
      "discover",
      "divorces",
      "varicose",
      "divorce",
      "sidecar",
      "viscera",
    ])
  })

  it("yields identical matching words for Spelling Bee puzzle", async () => {
    const puzzle = createPuzzle({
      size: toWordSize(6),
      mandatory: toMandatoryChar("m"),
      letters: toLetterPool("mitncao"),
      dictionary: "dictionary",
      repeats: true,
    })

    const cliWords = await collectCliWords(puzzle)
    const webGroups = solveWords(puzzle, dictWords)
    const webWords = webGroups.flatMap((g) => g.words)

    expect([...cliWords].sort()).toEqual([...webWords].sort())
    expect(webWords.length).toBeGreaterThan(0)
  })
})
