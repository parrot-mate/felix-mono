import { runPromptLogAtom } from "@/atom/runPromptLogAtom"
import {
  Prompt,
  PromptFieldType,
  PromptKeys,
  PromptVariable,
} from "@pmate/meta"
import { runPrompt as runPromptSDK } from "@pmate/sdk"
import { atom } from "jotai"
import { atomFamily } from "jotai/utils"

export type RunPromptExecutionStatus = "idle" | "running" | "error" | "success"

export type RunPromptAccuracy = "low" | "medium" | "high"

export type RunPromptExecutionMode =
  | "off"
  | "realtime"
  | "streaming"
  | "agent-loop"

export type RunPromptExecutionState = {
  variables: Record<string, string>
  accuracy: RunPromptAccuracy
  executionMode: RunPromptExecutionMode
  status: RunPromptExecutionStatus
  result: unknown
  error?: string
  startedAt?: number
  finishedAt?: number
  durationMs?: number
}

type SyncPromptAction = {
  type: "syncPrompt"
  prompt: Prompt
}

type UpdateVariableAction = {
  type: "updateVariable"
  name: string
  value: string
}

type UpdateExecutionOptionsAction = {
  type: "updateExecutionOptions"
  accuracy?: RunPromptAccuracy
  executionMode?: RunPromptExecutionMode
}

type RunPromptAction = {
  type: "run"
  prompt: Prompt
}

type ResetAction = {
  type: "reset"
}

type RunPromptExecutionAction =
  | SyncPromptAction
  | UpdateVariableAction
  | UpdateExecutionOptionsAction
  | RunPromptAction
  | ResetAction

const splitLines = (text: string) => text.split(/\r?\n/)

const formatTime = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString()

const serializeLogValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return "(empty)"
  }
  if (typeof value === "string") {
    return value
  }
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

const formatVariableLines = (variables: Record<string, string>) => {
  const entries = Object.entries(variables)
  if (entries.length === 0) {
    return ["No variables provided."]
  }

  return entries.flatMap(([key, value]) => {
    if (value === undefined || value === null || value.trim() === "") {
      return [`${key}: (empty)`]
    }

    const [first, ...rest] = splitLines(String(value))
    if (rest.length === 0) {
      return [`${key}: ${first}`]
    }

    return [`${key}: ${first}`, ...rest.map((line) => `  ${line}`)]
  })
}

const replaceTemplateValue = (
  content: string,
  variables: Record<string, unknown>
) => {
  const handle = (match: string, rawKey: string) => {
    const key = rawKey.trim()
    const value = variables[key]
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return match
    }

    if (Array.isArray(value)) {
      return value.join(", ")
    }

    return String(value)
  }

  const mustacheRegex = /{{\s*(.*?)\s*}}/g
  const singleBraceRegex = /{\s*(.*?)\s*}/g

  const afterMustache = content.replace(mustacheRegex, handle)
  return afterMustache.replace(singleBraceRegex, handle)
}

const formatPromptMessageLines = (
  prompt: Prompt,
  variables: Record<string, unknown>
) => {
  if (prompt.messages.length === 0) {
    return ["No prompt messages defined."]
  }

  return prompt.messages.flatMap((message, index) => {
    const resolved = replaceTemplateValue(message.content, variables)
    const lines = splitLines(resolved)
    const header = `${message.role}:`
    const contentLines =
      lines.length === 0 || lines.every((line) => line.trim().length === 0)
        ? ["(empty)"]
        : lines

    const section = [header, ...contentLines]

    if (index < prompt.messages.length - 1) {
      section.push("")
    }

    return section
  })
}

const createInitialState = (): RunPromptExecutionState => ({
  variables: {},
  accuracy: "medium",
  executionMode: "off",
  status: "idle",
  result: null,
  error: undefined,
  startedAt: undefined,
  finishedAt: undefined,
  durationMs: undefined,
})

const parseVariableValue = (
  value: string | undefined,
  variable: PromptVariable
) => {
  if (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "")
  ) {
    if (variable.required === false) {
      return undefined
    }
  }

  const trimmed = value?.trim?.() ?? value ?? ""
  switch (variable.type) {
    case PromptFieldType.Number: {
      const parsed = Number(trimmed)
      if (Number.isNaN(parsed)) {
        throw new Error(`"${variable.name}" must be a number.`)
      }
      return parsed
    }
    case PromptFieldType.MultiSelect: {
      return trimmed
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean)
    }
    case PromptFieldType.Date: {
      const timestamp = Date.parse(trimmed)
      if (Number.isNaN(timestamp)) {
        throw new Error(`"${variable.name}" must be a valid date.`)
      }
      return new Date(timestamp).toISOString()
    }
    default:
      return trimmed
  }
}

export const runPromptExecutionAtom = atomFamily((_promptKey: string) => {
  const baseAtom = atom<RunPromptExecutionState>(createInitialState())
  const logAtom = runPromptLogAtom(_promptKey)

  return atom(
    (get) => get(baseAtom),
    async (get, set, action: RunPromptExecutionAction) => {
      if (action.type === "reset") {
        set(baseAtom, createInitialState())
        set(logAtom, { type: "reset" })
        return
      }

      if (action.type === "syncPrompt") {
        const prev = get(baseAtom)
        const nextVariables = { ...prev.variables }
        const expectedNames = new Set(
          action.prompt.variables.map((variable) => variable.name)
        )
        action.prompt.variables.forEach((variable) => {
          if (!(variable.name in nextVariables)) {
            nextVariables[variable.name] =
              variable.type === PromptFieldType.Language ? "en" : ""
          }
        })
        Object.keys(nextVariables).forEach((name) => {
          if (!expectedNames.has(name)) {
            delete nextVariables[name]
          }
        })

        set(baseAtom, {
          ...prev,
          variables: nextVariables,
        })
        return
      }

      if (action.type === "updateVariable") {
        const prev = get(baseAtom)
        set(baseAtom, {
          ...prev,
          variables: {
            ...prev.variables,
            [action.name]: action.value,
          },
        })
        return
      }

      if (action.type === "updateExecutionOptions") {
        const prev = get(baseAtom)
        set(baseAtom, {
          ...prev,
          accuracy: action.accuracy ?? prev.accuracy,
          executionMode: action.executionMode ?? prev.executionMode,
        })
        return
      }

      if (action.type === "run") {
        const current = get(baseAtom)
        const start = Date.now()
        const inputs = current.variables

        set(logAtom, { type: "reset" })
        set(logAtom, {
          type: "appendLine",
          text: `[${formatTime(start)}] Run started for ${action.prompt.key}.`,
        })
        set(logAtom, {
          type: "appendBlock",
          title: "Variables",
          lines: formatVariableLines(inputs),
        })
        set(logAtom, {
          type: "appendBlock",
          title: "Execution Options",
          lines: [
            `Accuracy: ${current.accuracy}`,
            `Mode: ${current.executionMode === "off" ? "false" : current.executionMode}`,
          ],
        })
        set(logAtom, {
          type: "appendLine",
          text: "Validating variables…",
        })

        set(baseAtom, {
          ...current,
          status: "running",
          startedAt: start,
          finishedAt: undefined,
          durationMs: undefined,
          error: undefined,
          result: null,
        })

        const missingVariables = action.prompt.variables.filter((variable) => {
          const isRequired = variable.required ?? true
          if (!isRequired) {
            return false
          }
          const rawValue = inputs[variable.name]
          if (rawValue === undefined) {
            return true
          }
          if (typeof rawValue === "string") {
            return rawValue.trim() === ""
          }
          return false
        })

        if (missingVariables.length > 0) {
          const message = `Missing variable: ${missingVariables
            .map((variable) => variable.name)
            .join(", ")}`
          set(baseAtom, {
            ...current,
            variables: inputs,
            status: "error",
            startedAt: start,
            finishedAt: start,
            durationMs: 0,
            error: message,
            result: null,
          })
          set(logAtom, {
            type: "appendBlock",
            title: "Validation Error",
            lines: [
              `Missing variables: ${missingVariables
                .map((variable) => variable.name)
                .join(", ")}`,
              "Run aborted.",
            ],
          })
          return
        }

        const parsed: Record<string, unknown> = {}
        try {
          action.prompt.variables.forEach((variable) => {
            const rawValue = inputs[variable.name]
            const parsedValue = parseVariableValue(rawValue, variable)
            if (parsedValue !== undefined) {
              parsed[variable.name] = parsedValue
            }
          })
          set(logAtom, {
            type: "appendLine",
            text: "All variables validated.",
          })
          set(logAtom, {
            type: "appendBlock",
            title: "Prompt preview",
            lines: formatPromptMessageLines(action.prompt, parsed),
          })
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to parse variables."
          set(baseAtom, {
            ...current,
            variables: inputs,
            status: "error",
            startedAt: start,
            finishedAt: start,
            durationMs: 0,
            error: message,
            result: null,
          })
          set(logAtom, {
            type: "appendBlock",
            title: "Validation Error",
            lines: [
              "Run aborted due to validation error.",
              `Error: ${message}`,
            ],
          })
          return
        }

        set(logAtom, {
          type: "appendLine",
          text: "Executing prompt…",
        })

        try {
          const result = await runPromptSDK(
            action.prompt.key as PromptKeys,
            parsed
          )

          const finishedAt = Date.now()
          const latest = get(baseAtom)
          const duration = finishedAt - (latest.startedAt ?? start)
          set(baseAtom, {
            ...latest,
            status: "success",
            finishedAt,
            durationMs: duration,
            error: undefined,
            result,
          })
          set(logAtom, {
            type: "appendBlock",
            title: "Result",
            lines: [
              `Execution finished successfully at ${formatTime(finishedAt)}.`,
              `Duration: ${duration} ms.`,
              "Output:",
              ...splitLines(serializeLogValue(result)).map(
                (line) => `  ${line}`
              ),
            ],
          })
        } catch (error) {
          const finishedAt = Date.now()
          const latest = get(baseAtom)
          const message =
            error instanceof Error ? error.message : "Failed to run prompt."
          const duration = finishedAt - (latest.startedAt ?? start)
          set(baseAtom, {
            ...latest,
            status: "error",
            finishedAt,
            durationMs: duration,
            error: message,
            result: null,
          })
          set(logAtom, {
            type: "appendBlock",
            title: "Execution Error",
            lines: [
              `Execution failed at ${formatTime(finishedAt)}.`,
              `Duration: ${duration} ms.`,
              `Error: ${message}`,
            ],
          })
        }
      }
    }
  )
})
