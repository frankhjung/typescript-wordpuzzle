/**
 * Web application bootstrap and runtime store wiring.
 */

import { loadDictionary } from "./dictionary.js"
import { WebModel, WebMsg, initialModel, update } from "./model.js"
import { renderApp, updateAppView } from "./view.js"

let currentModel: WebModel = initialModel
let mountNode: HTMLElement | null = null

/**
 * Dispatches an application event, updates state via the pure reducer,
 * and re-renders the DOM view tree.
 *
 * @param msg - Application message to process.
 */
export function dispatch(msg: WebMsg): void {
  currentModel = update(currentModel, msg)
  render()

  if (msg.type === "retry") {
    void fetchDictionary()
  }
}

/**
 * Renders the top-level application view into the mount DOM element.
 * Updates DOM in place when shell already exists to maintain input focus.
 */
function render(): void {
  if (mountNode === null) {
    return
  }

  const existingShell = mountNode.querySelector<HTMLElement>(".app-shell")
  if (existingShell === null) {
    mountNode.replaceChildren(renderApp(currentModel, dispatch))
  } else {
    updateAppView(existingShell, currentModel, dispatch)
  }
}

/**
 * Asynchronously triggers dictionary retrieval and dispatches the outcome.
 */
async function fetchDictionary(): Promise<void> {
  try {
    const content = await loadDictionary()
    dispatch({ type: "got_dictionary_content", content })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    dispatch({ type: "got_dictionary_failure", message })
  }
}

/**
 * Initializes the web application on a specified mount container element.
 *
 * @param rootElementId - DOM element ID to mount into (defaults to 'app').
 */
export function initApp(rootElementId: string = "app"): void {
  const root = document.getElementById(rootElementId)
  if (root === null) {
    console.error(`Mount node #${rootElementId} not found.`)
    return
  }

  mountNode = root
  currentModel = Object.freeze({
    ...initialModel,
    dictionary: Object.freeze({ type: "loading" }),
  })
  render()

  void fetchDictionary()
}

// Auto-boot if running in browser runtime
if (typeof window !== "undefined" && typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initApp()
    })
  } else {
    initApp()
  }
}
