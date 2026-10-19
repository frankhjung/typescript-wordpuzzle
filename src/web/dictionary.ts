/**
 * Dictionary loader supporting synchronous preloaded script assets and
 * asynchronous HTTP fetch fallback.
 */

declare global {
  interface Window {
    WORDPUZZLE_DICTIONARY?: string
  }
}

/**
 * Parses raw newline-delimited dictionary text into a list of words.
 * Pure function with referential transparency.
 *
 * @param content - Newline-delimited dictionary text.
 * @returns Array of trimmed, non-empty candidate words.
 * @example
 * ```ts
 * const words = parseDictionary("apple\nbanana\ncherry")
 * ```
 */
export function parseDictionary(content: string): readonly string[] {
  const lines = content.split(/\r?\n/)
  const result: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.length > 0) {
      result.push(trimmed)
    }
  }

  return Object.freeze(result)
}

/**
 * Asynchronously loads the candidate word list.
 * Inspects window.WORDPUZZLE_DICTIONARY for instant preloaded content before
 * issuing an HTTP GET request to './dictionary'.
 *
 * @returns Promise resolving to the raw dictionary string content.
 * @throws Error if network fetch fails or returns a non-200 HTTP status.
 */
export async function loadDictionary(): Promise<string> {
  if (
    typeof window !== "undefined" &&
    typeof window.WORDPUZZLE_DICTIONARY === "string" &&
    window.WORDPUZZLE_DICTIONARY.length > 0
  ) {
    return window.WORDPUZZLE_DICTIONARY
  }

  const response = await fetch("./dictionary")
  if (!response.ok) {
    throw new Error(
      `Failed to download dictionary: HTTP ${response.status} ` +
        `${response.statusText}`,
    )
  }

  return response.text()
}
