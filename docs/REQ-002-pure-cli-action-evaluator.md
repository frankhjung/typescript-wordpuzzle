---
status: accepted
---

# Pure CLI Action Evaluator

Decouple command-line argument scanning, applicative validation, and exit code
determination from stream I/O by introducing a referentially transparent
`evaluateCli` function returning a discriminated `CliAction` union. This
refines the CLI architecture in [REQ-001](REQ-001-wordpuzzle-specification.md),
establishing a strict Pure Core, Effectful Shell boundary in
[`src/cli.ts`](../src/cli.ts) where `runCli` acts as a minimal interpreter and
argument resolution can be verified without stream fixtures.
