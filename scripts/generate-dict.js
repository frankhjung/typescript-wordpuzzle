/**
 * Pre-build script converting the plaintext dictionary into a
 * browser-executable JavaScript script that sets window.WORDPUZZLE_DICTIONARY.
 * Enables zero-latency, offline dictionary initialization.
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const repoRoot = path.resolve(__dirname, "..")
const txtPath = path.join(repoRoot, "dictionary")
const staticDir = path.join(repoRoot, "static")
const jsPath = path.join(staticDir, "dictionary.js")

if (!fs.existsSync(txtPath)) {
  console.error(`Error: dictionary file not found at ${txtPath}`)
  process.exit(1)
}

const content = fs.readFileSync(txtPath, "utf8")
fs.mkdirSync(staticDir, { recursive: true })

const output = `window.WORDPUZZLE_DICTIONARY = ${JSON.stringify(content)};\n`
fs.writeFileSync(jsPath, output, "utf8")

console.log(
  `Generated ${jsPath} (${content.length} characters, ` +
    `${content.split("\n").length} words)`,
)
