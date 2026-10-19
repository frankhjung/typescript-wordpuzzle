/**
 * Pure, accessible DOM rendering functions for the web user interface.
 * Implements layout, form controls, error badges, status cards, and word chips.
 */

import { formatValidationError } from "../validation.js"
import { WebModel, WebMsg } from "./model.js"
import {
  affectsMandatory,
  affectsOtherLetters,
  affectsSize,
} from "./validation.js"

/**
 * Creates an accessible form input control group.
 */
function createField(config: {
  readonly id: string
  readonly label: string
  readonly hint: string
  readonly required: boolean
  readonly invalid: boolean
  readonly inputElement: HTMLInputElement
}): HTMLElement {
  const group = document.createElement("div")
  group.className = "form-group"

  const label = document.createElement("label")
  label.htmlFor = config.id
  label.className = "form-label"
  label.textContent = config.label

  if (config.required) {
    const indicator = document.createElement("span")
    indicator.className = "required-indicator"
    indicator.textContent = " *"
    label.appendChild(indicator)
  }

  const input = config.inputElement
  input.id = config.id
  input.className = config.invalid ? "form-input input-error" : "form-input"
  input.setAttribute("aria-label", config.label)
  input.setAttribute("aria-invalid", config.invalid ? "true" : "false")

  const hint = document.createElement("small")
  hint.className = "form-hint"
  hint.textContent = config.hint

  group.appendChild(label)
  group.appendChild(input)
  group.appendChild(hint)

  return group
}

/**
 * Renders an accessible word chip badge with bold teal mandatory letter
 * highlighting.
 * Pure function with referential transparency.
 *
 * @param mandatory - The mandatory single character to highlight.
 * @param word - The solution word string.
 * @returns HTMLSpanElement containing the styled chip badge.
 * @example
 * ```ts
 * const chip = renderWordChip("c", "discover")
 * ```
 */
export function renderWordChip(mandatory: string, word: string): HTMLElement {
  const chip = document.createElement("span")
  chip.className = "word-chip"

  const parts = word.split(mandatory)
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    if (part !== undefined && part.length > 0) {
      chip.appendChild(document.createTextNode(part))
    }
    if (i < parts.length - 1) {
      const strong = document.createElement("strong")
      strong.className = "char-mandatory"
      strong.textContent = mandatory
      chip.appendChild(strong)
    }
  }

  return chip
}

/**
 * Renders the puzzle input form pane.
 */
export function renderForm(
  model: WebModel,
  dispatch: (msg: WebMsg) => void,
): HTMLElement {
  const form = document.createElement("form")
  form.className = "puzzle-form"
  form.noValidate = true

  form.addEventListener("submit", (e) => {
    e.preventDefault()
    dispatch({ type: "submit" })
  })

  const title = document.createElement("h2")
  title.className = "form-title"
  title.textContent = "Puzzle Input"
  form.appendChild(title)

  const fieldset = document.createElement("fieldset")
  fieldset.className = "form-fieldset"
  fieldset.setAttribute("role", "group")
  fieldset.setAttribute("aria-label", "Puzzle constraints")

  const legend = document.createElement("legend")
  legend.className = "visually-hidden"
  legend.textContent = "Letter Constraints"
  fieldset.appendChild(legend)

  const formRow = document.createElement("div")
  formRow.className = "form-row"

  const activeErrors =
    model.outcome.type === "invalid" ? model.outcome.errors : []

  // Mandatory letter input
  const mandInput = document.createElement("input")
  mandInput.name = "mandatory"
  mandInput.type = "text"
  mandInput.value = model.form.mandatory
  mandInput.maxLength = 1
  mandInput.placeholder = "e.g. c"
  mandInput.autocomplete = "off"
  mandInput.setAttribute("autocapitalize", "none")
  mandInput.setAttribute("spellcheck", "false")
  mandInput.setAttribute("inputmode", "text")
  mandInput.setAttribute("aria-required", "true")
  mandInput.addEventListener("input", () => {
    dispatch({ type: "set_mandatory", raw: mandInput.value })
  })

  const mandField = createField({
    id: "input-mandatory",
    label: "Mandatory Letter",
    hint: "Single lowercase letter ('a' to 'z').",
    required: true,
    invalid: activeErrors.some(affectsMandatory),
    inputElement: mandInput,
  })
  formRow.appendChild(mandField)

  // Other letters input
  const othersInput = document.createElement("input")
  othersInput.name = "otherLetters"
  othersInput.type = "text"
  othersInput.value = model.form.otherLetters
  othersInput.maxLength = 8
  othersInput.placeholder = "e.g. adevrsoi"
  othersInput.autocomplete = "off"
  othersInput.setAttribute("autocapitalize", "none")
  othersInput.setAttribute("spellcheck", "false")
  othersInput.setAttribute("inputmode", "text")
  othersInput.setAttribute("aria-required", "true")
  othersInput.addEventListener("input", () => {
    dispatch({ type: "set_other_letters", raw: othersInput.value })
  })

  const othersField = createField({
    id: "input-other-letters",
    label: "Other Letters",
    hint: "3 to 8 additional unique letters to complete pool.",
    required: true,
    invalid: activeErrors.some(affectsOtherLetters),
    inputElement: othersInput,
  })
  formRow.appendChild(othersField)

  // Word size input
  const sizeInput = document.createElement("input")
  sizeInput.name = "size"
  sizeInput.type = "number"
  sizeInput.value = model.form.size
  sizeInput.min = "4"
  sizeInput.max = "9"
  sizeInput.setAttribute("inputmode", "numeric")
  sizeInput.addEventListener("input", () => {
    dispatch({ type: "set_size", raw: sizeInput.value })
  })

  const sizeField = createField({
    id: "input-size",
    label: "Minimum Word Size",
    hint: "Length between 4 and 9.",
    required: false,
    invalid: activeErrors.some(affectsSize),
    inputElement: sizeInput,
  })
  formRow.appendChild(sizeField)

  fieldset.appendChild(formRow)

  // Repeats checkbox
  const checkboxGroup = document.createElement("div")
  checkboxGroup.className = "form-group-checkbox"

  const checkboxLabel = document.createElement("label")
  checkboxLabel.className = "checkbox-label"

  const checkboxInput = document.createElement("input")
  checkboxInput.id = "toggle-repeats"
  checkboxInput.name = "repeats"
  checkboxInput.type = "checkbox"
  checkboxInput.className = "checkbox-input"
  checkboxInput.checked = model.form.repeats
  checkboxInput.addEventListener("change", () => {
    dispatch({ type: "toggle_repeats", enabled: checkboxInput.checked })
  })

  const checkboxText = document.createElement("span")
  checkboxText.className = "checkbox-text"
  checkboxText.textContent = "Allow repeating letters?"

  checkboxLabel.appendChild(checkboxInput)
  checkboxLabel.appendChild(checkboxText)

  const checkboxHint = document.createElement("small")
  checkboxHint.className = "form-hint"
  checkboxHint.textContent =
    "Permits letters to be reused without length limit (e.g. Spelling Bee)."

  checkboxGroup.appendChild(checkboxLabel)
  checkboxGroup.appendChild(checkboxHint)
  fieldset.appendChild(checkboxGroup)

  form.appendChild(fieldset)

  // Actions
  const formActions = document.createElement("div")
  formActions.className = "form-actions"

  const isDictLoading = model.dictionary.type === "loading"

  const submitBtn = document.createElement("button")
  submitBtn.id = "btn-solve"
  submitBtn.type = "submit"
  submitBtn.className = "btn-primary"
  submitBtn.disabled = isDictLoading

  if (isDictLoading) {
    const loadingSpan = document.createElement("span")
    loadingSpan.className = "btn-loading-content"

    const spinner = document.createElement("span")
    spinner.className = "spinner"

    loadingSpan.appendChild(spinner)
    loadingSpan.appendChild(document.createTextNode("Loading Dictionary..."))
    submitBtn.appendChild(loadingSpan)
  } else {
    submitBtn.textContent = "Solve Puzzle"
  }

  formActions.appendChild(submitBtn)
  form.appendChild(formActions)

  return form
}

/**
 * Renders the results pane displaying dictionary status, error summaries, or
 * matched word cards.
 */
export function renderResults(
  model: WebModel,
  dispatch: (msg: WebMsg) => void,
): HTMLElement {
  const container = document.createElement("div")
  container.className = "results-pane"
  container.setAttribute("aria-live", "polite")

  if (model.dictionary.type === "not_asked") {
    const card = document.createElement("div")
    card.className = "status-card status-empty"

    const title = document.createElement("h3")
    title.className = "status-title"
    title.textContent = "Dictionary Ready"

    const desc = document.createElement("p")
    desc.className = "status-desc"
    desc.textContent = "Dictionary will load upon initialization."

    card.appendChild(title)
    card.appendChild(desc)
    container.appendChild(card)
    return container
  }

  if (model.dictionary.type === "loading") {
    const card = document.createElement("div")
    card.className = "status-card status-loading"

    const spinner = document.createElement("div")
    spinner.className = "spinner-large"

    const title = document.createElement("h3")
    title.className = "status-title"
    title.textContent = "Loading Dictionary"

    const desc = document.createElement("p")
    desc.className = "status-desc"
    desc.textContent =
      "Downloading and indexing candidate word list in browser..."

    card.appendChild(spinner)
    card.appendChild(title)
    card.appendChild(desc)
    container.appendChild(card)
    return container
  }

  if (model.dictionary.type === "failure") {
    const alert = document.createElement("div")
    alert.className = "alert alert-error alert-banner"
    alert.setAttribute("role", "alert")

    const icon = document.createElement("div")
    icon.className = "alert-icon"
    icon.textContent = "!"

    const body = document.createElement("div")
    body.className = "alert-body"

    const title = document.createElement("h3")
    title.className = "alert-title"
    title.textContent = "Dictionary Failed to Load"

    const desc = document.createElement("p")
    desc.className = "alert-desc"
    desc.textContent = model.dictionary.message

    body.appendChild(title)
    body.appendChild(desc)

    const retryBtn = document.createElement("button")
    retryBtn.id = "btn-retry"
    retryBtn.type = "button"
    retryBtn.className = "btn-secondary"
    retryBtn.textContent = "Retry Download"
    retryBtn.addEventListener("click", () => {
      dispatch({ type: "retry" })
    })

    alert.appendChild(icon)
    alert.appendChild(body)
    alert.appendChild(retryBtn)
    container.appendChild(alert)
    return container
  }

  // Dictionary is ready: render solver outcome
  if (model.outcome.type === "not_solved") {
    const card = document.createElement("div")
    card.className = "status-card status-empty"

    const title = document.createElement("h3")
    title.className = "status-title"
    title.textContent = "Ready to Solve"

    const desc = document.createElement("p")
    desc.className = "status-desc"
    desc.textContent =
      "Configure mandatory letter and allowed letters, then press Solve."

    card.appendChild(title)
    card.appendChild(desc)
    container.appendChild(card)
    return container
  }

  if (model.outcome.type === "invalid") {
    const alert = document.createElement("div")
    alert.className = "alert alert-error"
    alert.setAttribute("role", "alert")

    const title = document.createElement("h3")
    title.className = "alert-title"
    title.textContent = "Validation Errors"

    const list = document.createElement("ul")
    list.className = "error-list"

    for (const err of model.outcome.errors) {
      const li = document.createElement("li")
      li.textContent = formatValidationError(err)
      list.appendChild(li)
    }

    alert.appendChild(title)
    alert.appendChild(list)
    container.appendChild(alert)
    return container
  }

  // Solved outcome
  const groups = model.outcome.groups
  const totalCount = groups.reduce((acc, g) => acc + g.words.length, 0)

  if (totalCount === 0) {
    const card = document.createElement("div")
    card.className = "status-card status-no-results"

    const title = document.createElement("h3")
    title.className = "status-title"
    title.textContent = "No Words Found"

    const desc = document.createElement("p")
    desc.className = "status-desc"
    desc.textContent = "No words in dictionary match the specified criteria."

    card.appendChild(title)
    card.appendChild(desc)
    container.appendChild(card)
    return container
  }

  const resultsContainer = document.createElement("div")
  resultsContainer.className = "results-container"

  const header = document.createElement("div")
  header.className = "results-header"

  const countSpan = document.createElement("span")
  countSpan.className = "results-count"
  countSpan.textContent = `Found ${totalCount} words`
  header.appendChild(countSpan)
  resultsContainer.appendChild(header)

  const groupsList = document.createElement("div")
  groupsList.className = "word-groups-list"

  const mandatoryChar = model.outcome.puzzle.mandatory

  for (const group of groups) {
    const card = document.createElement("div")
    card.className = "word-group-card"

    const groupTitle = document.createElement("h3")
    groupTitle.className = "word-group-title"
    const count = group.words.length
    groupTitle.textContent = `${group.length}-Letter Words (${count})`
    card.appendChild(groupTitle)

    const chipsContainer = document.createElement("div")
    chipsContainer.className = "chips-container"

    for (const word of group.words) {
      chipsContainer.appendChild(renderWordChip(mandatoryChar, word))
    }

    card.appendChild(chipsContainer)
    groupsList.appendChild(card)
  }

  resultsContainer.appendChild(groupsList)
  container.appendChild(resultsContainer)
  return container
}

/**
 * Renders the full application shell.
 * Pure function with referential transparency.
 *
 * @param model - Current application state snapshot.
 * @param dispatch - Message dispatcher to trigger state transitions.
 * @returns Fully constructed root application HTMLElement.
 * @example
 * ```ts
 * const root = renderApp(model, dispatch)
 * ```
 */
export function renderApp(
  model: WebModel,
  dispatch: (msg: WebMsg) => void,
): HTMLElement {
  const shell = document.createElement("div")
  shell.className = "app-shell"

  // Header
  const header = document.createElement("header")
  header.className = "app-header"

  const headerInner = document.createElement("div")
  headerInner.className = "header-inner"

  const title = document.createElement("h1")
  title.className = "app-title"
  title.textContent = "Word Puzzle Solver"

  headerInner.appendChild(title)
  header.appendChild(headerInner)
  shell.appendChild(header)

  // Main
  const main = document.createElement("main")
  main.className = "app-main"

  const layout = document.createElement("div")
  layout.className = "layout-container"

  const formPane = document.createElement("div")
  formPane.className = "pane-form"
  formPane.appendChild(renderForm(model, dispatch))

  const resultsPane = document.createElement("div")
  resultsPane.className = "pane-results"
  resultsPane.appendChild(renderResults(model, dispatch))

  layout.appendChild(formPane)
  layout.appendChild(resultsPane)
  main.appendChild(layout)
  shell.appendChild(main)

  // Footer
  const footer = document.createElement("footer")
  footer.className = "app-footer"

  const footerText = document.createElement("p")
  footerText.appendChild(document.createTextNode("Ported from the "))

  const repoLink = document.createElement("a")
  repoLink.href = "https://github.com/frankhjung/haskell-wordpuzzle"
  repoLink.target = "_blank"
  repoLink.rel = "noopener noreferrer"
  repoLink.textContent = "Haskell Word Puzzle Solver"

  footerText.appendChild(repoLink)
  footerText.appendChild(document.createTextNode(" · Built with TypeScript"))

  footer.appendChild(footerText)
  shell.appendChild(footer)

  return shell
}

/**
 * Updates an already-mounted application DOM tree in place.
 * Preserves active input elements, selection ranges, and keyboard focus.
 *
 * @param shell - The root .app-shell HTMLElement.
 * @param model - Current application state snapshot.
 * @param dispatch - Message dispatcher to trigger state transitions.
 */
export function updateAppView(
  shell: HTMLElement,
  model: WebModel,
  dispatch: (msg: WebMsg) => void,
): void {
  const activeErrors =
    model.outcome.type === "invalid" ? model.outcome.errors : []

  // Update Mandatory Letter input
  const mandInput = shell.querySelector<HTMLInputElement>("#input-mandatory")
  if (mandInput !== null) {
    const isInvalid = activeErrors.some(affectsMandatory)
    mandInput.className = isInvalid ? "form-input input-error" : "form-input"
    mandInput.setAttribute("aria-invalid", isInvalid ? "true" : "false")
    if (document.activeElement === mandInput) {
      if (mandInput.value !== model.form.mandatory) {
        const start = mandInput.selectionStart
        const end = mandInput.selectionEnd
        mandInput.value = model.form.mandatory
        if (start !== null && end !== null) {
          mandInput.setSelectionRange(start, end)
        }
      }
    } else {
      mandInput.value = model.form.mandatory
    }
  }

  // Update Other Letters input
  const othersInput = shell.querySelector<HTMLInputElement>(
    "#input-other-letters",
  )
  if (othersInput !== null) {
    const isInvalid = activeErrors.some(affectsOtherLetters)
    othersInput.className = isInvalid ? "form-input input-error" : "form-input"
    othersInput.setAttribute("aria-invalid", isInvalid ? "true" : "false")
    if (document.activeElement === othersInput) {
      if (othersInput.value !== model.form.otherLetters) {
        const start = othersInput.selectionStart
        const end = othersInput.selectionEnd
        othersInput.value = model.form.otherLetters
        if (start !== null && end !== null) {
          othersInput.setSelectionRange(start, end)
        }
      }
    } else {
      othersInput.value = model.form.otherLetters
    }
  }

  // Update Word Size input
  const sizeInput = shell.querySelector<HTMLInputElement>("#input-size")
  if (sizeInput !== null) {
    const isInvalid = activeErrors.some(affectsSize)
    sizeInput.className = isInvalid ? "form-input input-error" : "form-input"
    sizeInput.setAttribute("aria-invalid", isInvalid ? "true" : "false")
    if (document.activeElement === sizeInput) {
      if (sizeInput.value !== model.form.size) {
        const start = sizeInput.selectionStart
        const end = sizeInput.selectionEnd
        sizeInput.value = model.form.size
        if (start !== null && end !== null) {
          sizeInput.setSelectionRange(start, end)
        }
      }
    } else {
      sizeInput.value = model.form.size
    }
  }

  // Update Repeats checkbox
  const repeatsInput = shell.querySelector<HTMLInputElement>("#toggle-repeats")
  if (repeatsInput !== null) {
    repeatsInput.checked = model.form.repeats
  }

  // Update Submit button
  const submitBtn = shell.querySelector<HTMLButtonElement>("#btn-solve")
  if (submitBtn !== null) {
    const isDictLoading = model.dictionary.type === "loading"
    submitBtn.disabled = isDictLoading
    submitBtn.replaceChildren()
    if (isDictLoading) {
      const loadingSpan = document.createElement("span")
      loadingSpan.className = "btn-loading-content"
      const spinner = document.createElement("span")
      spinner.className = "spinner"
      loadingSpan.appendChild(spinner)
      loadingSpan.appendChild(document.createTextNode("Loading Dictionary..."))
      submitBtn.appendChild(loadingSpan)
    } else {
      submitBtn.appendChild(document.createTextNode("Solve Puzzle"))
    }
  }

  // Update Results pane
  const resultsPane = shell.querySelector<HTMLElement>(".pane-results")
  if (resultsPane !== null) {
    resultsPane.replaceChildren(renderResults(model, dispatch))
  }
}
