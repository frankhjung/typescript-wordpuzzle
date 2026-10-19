/**
 * Unidirectional state models, actions, and reducer for the web application.
 */

import { Puzzle, ValidationError, assertNever } from "../domain.js"
import { parseDictionary } from "./dictionary.js"
import { WordGroup, solveWords } from "./solver.js"
import {
  FormState,
  initialForm,
  lowerLetters,
  sanitizeSizeInput,
  validateWebForm,
} from "./validation.js"

/**
 * Four-state lifecycle model for the asynchronous dictionary asset.
 */
export type DictionaryStatus =
  | { readonly type: "not_asked" }
  | { readonly type: "loading" }
  | { readonly type: "failure"; readonly message: string }
  | { readonly type: "success"; readonly words: readonly string[] }

/**
 * Result display state for solver executions and validation outcomes.
 */
export type SolverOutcome =
  | { readonly type: "not_solved" }
  | { readonly type: "invalid"; readonly errors: readonly ValidationError[] }
  | {
      readonly type: "solved"
      readonly puzzle: Puzzle
      readonly groups: readonly WordGroup[]
    }

/**
 * Top-level application state model.
 */
export interface WebModel {
  readonly dictionary: DictionaryStatus
  readonly form: FormState
  readonly outcome: SolverOutcome
}

/**
 * Discriminated algebraic data variants representing all possible application
 * events driving state transitions.
 */
export type WebMsg =
  | { readonly type: "got_dictionary_content"; readonly content: string }
  | { readonly type: "got_dictionary_failure"; readonly message: string }
  | { readonly type: "set_mandatory"; readonly raw: string }
  | { readonly type: "set_other_letters"; readonly raw: string }
  | { readonly type: "set_size"; readonly raw: string }
  | { readonly type: "toggle_repeats"; readonly enabled: boolean }
  | { readonly type: "submit" }
  | { readonly type: "retry" }

/**
 * Default initial application state snapshot.
 */
export const initialModel: WebModel = Object.freeze({
  dictionary: Object.freeze({ type: "not_asked" }),
  form: initialForm,
  outcome: Object.freeze({ type: "not_solved" }),
})

/**
 * Pure state transition function responding to user input and async events.
 * Preserves the current outcome when form inputs change, matching the Elm
 * state machine.
 *
 * @param model - Current application state snapshot.
 * @param msg - Application event to process.
 * @returns Updated application state snapshot.
 * @example
 * ```ts
 * const next = update(model, { type: "set_mandatory", raw: "c" })
 * ```
 */
export function update(model: WebModel, msg: WebMsg): WebModel {
  switch (msg.type) {
    case "got_dictionary_content": {
      const words = parseDictionary(msg.content)
      return Object.freeze({
        ...model,
        dictionary: Object.freeze({
          type: "success",
          words,
        }),
      })
    }

    case "got_dictionary_failure":
      return Object.freeze({
        ...model,
        dictionary: Object.freeze({
          type: "failure",
          message: msg.message,
        }),
      })

    case "set_mandatory":
      return Object.freeze({
        ...model,
        form: Object.freeze({
          ...model.form,
          mandatory: lowerLetters(1, msg.raw),
        }),
      })

    case "set_other_letters":
      return Object.freeze({
        ...model,
        form: Object.freeze({
          ...model.form,
          otherLetters: lowerLetters(8, msg.raw),
        }),
      })

    case "set_size":
      return Object.freeze({
        ...model,
        form: Object.freeze({
          ...model.form,
          size: sanitizeSizeInput(msg.raw),
        }),
      })

    case "toggle_repeats":
      return Object.freeze({
        ...model,
        form: Object.freeze({
          ...model.form,
          repeats: msg.enabled,
        }),
      })

    case "retry":
      return Object.freeze({
        ...model,
        dictionary: Object.freeze({ type: "loading" }),
      })

    case "submit": {
      if (model.dictionary.type !== "success") {
        return model
      }

      const validationRes = validateWebForm(model.form)
      if (!validationRes.ok) {
        return Object.freeze({
          ...model,
          outcome: Object.freeze({
            type: "invalid",
            errors: validationRes.errors,
          }),
        })
      }

      const puzzle = validationRes.value
      const groups = solveWords(puzzle, model.dictionary.words)

      return Object.freeze({
        ...model,
        outcome: Object.freeze({
          type: "solved",
          puzzle,
          groups,
        }),
      })
    }

    default:
      return assertNever(msg)
  }
}
