import { atom } from "jotai"
import { atomFamily } from "jotai/utils"

export type RunPromptLogEntry =
  | { type: "line"; text: string }
  | { type: "block"; title: string; lines: string[] }

type RunPromptLogAction =
  | { type: "reset" }
  | { type: "appendLine"; text: string }
  | { type: "appendBlock"; title: string; lines: string[] }

export const runPromptLogAtom = atomFamily((_promptKey: string) => {
  const baseAtom = atom<RunPromptLogEntry[]>([])

  return atom(
    (get) => get(baseAtom),
    (_get, set, action: RunPromptLogAction) => {
      if (action.type === "reset") {
        set(baseAtom, [])
        return
      }

      if (action.type === "appendLine") {
        set(baseAtom, (prev) => [...prev, { type: "line", text: action.text }])
        return
      }

      if (action.type === "appendBlock") {
        set(baseAtom, (prev) => [
          ...prev,
          {
            type: "block",
            title: action.title,
            lines: action.lines,
          },
        ])
      }
    }
  )
})
