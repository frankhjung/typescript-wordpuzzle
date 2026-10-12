import { describe, expect, it } from "vitest"
import { PassThrough } from "node:stream"
import { HELP_TEXT, runCli, VERSION } from "../src/cli.js"

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
