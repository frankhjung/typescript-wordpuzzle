/**
 * @vitest-environment happy-dom
 */

/**
 * Tests for web UI DOM rendering, in-place updates, and focus preservation.
 */

import { describe, expect, it } from "vitest"
import { initialModel, update } from "../src/web/model.js"
import { renderApp, updateAppView } from "../src/web/view.js"

describe("web UI view and focus preservation", () => {
  it("renders the initial app shell into the DOM", () => {
    let currentModel = initialModel
    const dispatch = (msg: Parameters<typeof update>[1]): void => {
      currentModel = update(currentModel, msg)
    }

    const shell = renderApp(currentModel, dispatch)
    expect(shell.querySelector("h1")?.textContent).toBe("Word Puzzle Solver")
    expect(shell.querySelector("#input-mandatory")).not.toBeNull()
    expect(shell.querySelector("#input-other-letters")).not.toBeNull()
    expect(shell.querySelector("#input-size")).not.toBeNull()
    expect(shell.querySelector("#btn-solve")).not.toBeNull()
  })

  it("preserves focus and cursor position in other-letters input", () => {
    let currentModel = initialModel
    const dispatch = (msg: Parameters<typeof update>[1]): void => {
      currentModel = update(currentModel, msg)
    }

    const shell = renderApp(currentModel, dispatch)
    document.body.appendChild(shell)

    const othersInput = shell.querySelector<HTMLInputElement>(
      "#input-other-letters",
    )
    expect(othersInput).not.toBeNull()
    if (othersInput === null) return

    // Focus the input
    othersInput.focus()
    expect(document.activeElement).toBe(othersInput)

    // Simulate typing first character 'a'
    othersInput.value = "a"
    othersInput.setSelectionRange(1, 1)
    dispatch({ type: "set_other_letters", raw: "a" })
    updateAppView(shell, currentModel, dispatch)

    // Verify focus remains on the input and selection is preserved
    expect(document.activeElement).toBe(othersInput)
    expect(othersInput.selectionStart).toBe(1)
    expect(othersInput.selectionEnd).toBe(1)

    // Simulate typing second character 'd'
    othersInput.value = "ad"
    othersInput.setSelectionRange(2, 2)
    dispatch({ type: "set_other_letters", raw: "ad" })
    updateAppView(shell, currentModel, dispatch)

    expect(document.activeElement).toBe(othersInput)
    expect(othersInput.selectionStart).toBe(2)
    expect(othersInput.selectionEnd).toBe(2)

    // Simulate typing remaining letters 'evrsoi'
    othersInput.value = "adevrsoi"
    othersInput.setSelectionRange(8, 8)
    dispatch({ type: "set_other_letters", raw: "adevrsoi" })
    updateAppView(shell, currentModel, dispatch)

    expect(document.activeElement).toBe(othersInput)
    expect(othersInput.value).toBe("adevrsoi")
    expect(othersInput.selectionStart).toBe(8)
    expect(othersInput.selectionEnd).toBe(8)

    document.body.removeChild(shell)
  })

  it("preserves focus and sanitises uppercase input", () => {
    let currentModel = initialModel
    const dispatch = (msg: Parameters<typeof update>[1]): void => {
      currentModel = update(currentModel, msg)
    }

    const shell = renderApp(currentModel, dispatch)
    document.body.appendChild(shell)

    const othersInput = shell.querySelector<HTMLInputElement>(
      "#input-other-letters",
    )
    expect(othersInput).not.toBeNull()
    if (othersInput === null) return

    othersInput.focus()
    othersInput.value = "A"
    othersInput.setSelectionRange(1, 1)
    dispatch({ type: "set_other_letters", raw: "A" })
    updateAppView(shell, currentModel, dispatch)

    expect(document.activeElement).toBe(othersInput)
    expect(othersInput.value).toBe("a")
    expect(othersInput.selectionStart).toBe(1)
    expect(othersInput.selectionEnd).toBe(1)

    document.body.removeChild(shell)
  })

  it("updates results pane on solve without destroying input elements", () => {
    let currentModel = initialModel
    const dispatch = (msg: Parameters<typeof update>[1]): void => {
      currentModel = update(currentModel, msg)
    }

    const shell = renderApp(currentModel, dispatch)
    document.body.appendChild(shell)

    const mandInput = shell.querySelector<HTMLInputElement>("#input-mandatory")
    const othersInput = shell.querySelector<HTMLInputElement>(
      "#input-other-letters",
    )
    expect(mandInput).not.toBeNull()
    expect(othersInput).not.toBeNull()

    // Load dictionary
    dispatch({
      type: "got_dictionary_content",
      content: "discover\ndivorce\ndivorces\nsidecar\nvaricose\nviscera\n",
    })
    updateAppView(shell, currentModel, dispatch)

    // Fill form
    dispatch({ type: "set_mandatory", raw: "c" })
    dispatch({ type: "set_other_letters", raw: "adevrsoi" })
    dispatch({ type: "set_size", raw: "7" })
    dispatch({ type: "toggle_repeats", enabled: false })
    dispatch({ type: "submit" })
    updateAppView(shell, currentModel, dispatch)

    // Form inputs should be the exact same DOM node instances
    expect(shell.querySelector("#input-mandatory")).toBe(mandInput)
    expect(shell.querySelector("#input-other-letters")).toBe(othersInput)

    // Results should display solved words
    const chips = shell.querySelectorAll(".word-chip")
    expect(chips.length).toBe(6)

    document.body.removeChild(shell)
  })
})
