import { describe, expect, it } from "vitest"
import { solve } from "../src/solver.js"
import {
  createPuzzle,
  toLetterPool,
  toMandatoryChar,
  toWordSize,
} from "../src/domain.js"

async function* createAsyncStream(
  words: readonly string[],
): AsyncIterable<string> {
  for (const word of words) {
    yield word
  }
}

describe("streaming solver", (): void => {
  const puzzle = createPuzzle({
    size: toWordSize(7),
    mandatory: toMandatoryChar("c"),
    letters: toLetterPool("cadevrsoi"),
    dictionary: "dictionary",
    repeats: false,
  })

  it("yields matching words from async stream", async (): Promise<void> => {
    const rawWords = ["  discover \n", "codrive", "short", "cat", "divorces"]
    const stream = createAsyncStream(rawWords)

    const matches: string[] = []
    for await (const match of solve(puzzle, stream)) {
      matches.push(match)
    }

    expect(matches).toEqual(["discover", "codrive", "divorces"])
  })

  it("ignores empty lines and non-matches", async (): Promise<void> => {
    const stream = createAsyncStream(["", "   ", "python", "javascript"])

    const matches: string[] = []
    for await (const match of solve(puzzle, stream)) {
      matches.push(match)
    }

    expect(matches).toEqual([])
  })

  it("matches dictionary words case-sensitively", async (): Promise<void> => {
    const stream = createAsyncStream([
      "DISCOVER",
      "discover",
      "Codrive",
      "SHORT",
      "cat",
    ])

    const matches: string[] = []
    for await (const match of solve(puzzle, stream)) {
      matches.push(match)
    }

    expect(matches).toEqual(["discover"])
  })
})
