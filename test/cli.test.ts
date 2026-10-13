import { describe, expect, it } from "vitest"
import { PassThrough } from "node:stream"
import { evaluateCli, HELP_TEXT, runCli, VERSION } from "../src/cli.js"

interface StreamCapture {
  readonly stream: PassThrough
  readonly getOutput: () => string
}

function createCapture(): StreamCapture {
  const stream = new PassThrough()
  let buffer = ""
  stream.on("data", (chunk: Buffer | string): void => {
    buffer += chunk.toString()
  })
  return {
    stream,
    getOutput: (): string => buffer,
  }
}

describe("CLI entrypoint and exit codes", (): void => {
  it("prints help and exits with code 0 on --help", async (): Promise<void> => {
    const stdout = createCapture()
    const stderr = createCapture()

    const exitCode = await runCli(["--help"], stdout.stream, stderr.stream)

    expect(exitCode).toBe(0)
    expect(stdout.getOutput()).toBe(HELP_TEXT)
    expect(stderr.getOutput()).toBe("")
  })

  it("prints version and exits with code 0 on -v", async (): Promise<void> => {
    const stdout = createCapture()
    const stderr = createCapture()

    const exitCode = await runCli(["-v"], stdout.stream, stderr.stream)

    expect(exitCode).toBe(0)
    expect(stdout.getOutput()).toBe(`${VERSION}\n`)
    expect(stderr.getOutput()).toBe("")
  })

  it("exits with code 2 on unknown flags", async (): Promise<void> => {
    const stdout = createCapture()
    const stderr = createCapture()

    const exitCode = await runCli(["--invalid"], stdout.stream, stderr.stream)

    expect(exitCode).toBe(2)
    expect(stderr.getOutput()).toContain("Error:")
  })

  it("exits with code 1 on validation errors", async (): Promise<void> => {
    const stdout = createCapture()
    const stderr = createCapture()

    const exitCode = await runCli(
      ["-s", "2", "-l", "abc"],
      stdout.stream,
      stderr.stream,
    )

    expect(exitCode).toBe(1)
    expect(stderr.getOutput()).toContain("Invalid size '2'")
    expect(stderr.getOutput()).toContain("Invalid letters 'abc'")
  })

  it(
    "reports all parse and validation errors " + "before exiting",
    async (): Promise<void> => {
      const stdout = createCapture()
      const stderr = createCapture()

      const exitCode = await runCli(
        ["--invalid", "-s", "2", "-l", "abc"],
        stdout.stream,
        stderr.stream,
      )

      const output = stderr.getOutput()
      expect(exitCode).toBe(2)
      expect(output).toContain("Unknown option '--invalid'.")
      expect(output).toContain("Invalid size '2'")
      expect(output).toContain("Invalid letters 'abc'")
    },
  )

  it("exits with code 1 on missing dictionary", async (): Promise<void> => {
    const stdout = createCapture()
    const stderr = createCapture()

    const exitCode = await runCli(
      ["-l", "cadevrsoi", "-d", "nonexistent-dictionary-file"],
      stdout.stream,
      stderr.stream,
    )

    expect(exitCode).toBe(1)
    expect(stderr.getOutput()).toContain("Dictionary file not found")
  })

  it("solves puzzle and outputs words on stdout", async (): Promise<void> => {
    const stdout = createCapture()
    const stderr = createCapture()

    const exitCode = await runCli(
      ["-s", "7", "-l", "cadevrsoi"],
      stdout.stream,
      stderr.stream,
    )

    expect(exitCode).toBe(0)
    const outputWords = stdout
      .getOutput()
      .trim()
      .split("\n")
      .filter((w) => w.length > 0)

    expect(outputWords).toContain("discover")
    expect(outputWords).toContain("divorces")
    expect(outputWords).toContain("sidecar")
  })
})

describe("evaluateCli pure action resolution", (): void => {
  it("resolves help action on --help and -h", (): void => {
    const longAction = evaluateCli(["--help"])
    expect(longAction).toEqual({ type: "help", text: HELP_TEXT })

    const shortAction = evaluateCli(["-h"])
    expect(shortAction).toEqual({ type: "help", text: HELP_TEXT })
  })

  it("resolves version action on --version and -v", (): void => {
    const longAction = evaluateCli(["--version"])
    expect(longAction).toEqual({ type: "version", text: `${VERSION}\n` })

    const shortAction = evaluateCli(["-v"])
    expect(shortAction).toEqual({ type: "version", text: `${VERSION}\n` })
  })

  it("resolves syntax errors with exit code 2", (): void => {
    const action = evaluateCli(["--invalid"])
    expect(action.type).toBe("error")
    if (action.type === "error") {
      expect(action.exitCode).toBe(2)
      expect(action.messages.some((m) => m.includes("Unknown option"))).toBe(
        true,
      )
    }
  })

  it("resolves validation errors with exit code 1", (): void => {
    const action = evaluateCli(["-s", "2", "-l", "abc"])
    expect(action.type).toBe("error")
    if (action.type === "error") {
      expect(action.exitCode).toBe(1)
      expect(action.messages.some((m) => m.includes("Invalid size '2'"))).toBe(
        true,
      )
      expect(
        action.messages.some((m) => m.includes("Invalid letters 'abc'")),
      ).toBe(true)
    }
  })

  it("accumulates syntax and validation errors with code 2", (): void => {
    const action = evaluateCli(["--invalid", "-s", "2", "-l", "abc"])
    expect(action.type).toBe("error")
    if (action.type === "error") {
      expect(action.exitCode).toBe(2)
      expect(action.messages.some((m) => m.includes("Unknown option"))).toBe(
        true,
      )
      expect(action.messages.some((m) => m.includes("Invalid size '2'"))).toBe(
        true,
      )
    }
  })

  it("resolves solve action with validated puzzle", (): void => {
    const action = evaluateCli([
      "-s",
      "7",
      "-l",
      "cadevrsoi",
      "-r",
      "-d",
      "dict.txt",
    ])
    expect(action.type).toBe("solve")
    if (action.type === "solve") {
      expect(action.puzzle.size).toBe(7)
      expect(action.puzzle.letters).toBe("cadevrsoi")
      expect(action.puzzle.mandatory).toBe("c")
      expect(action.puzzle.repeats).toBe(true)
      expect(action.puzzle.dictionary).toBe("dict.txt")
    }
  })
})
