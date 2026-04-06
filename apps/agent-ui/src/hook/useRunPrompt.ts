import { Prompt, PromptKeys, PromptVariable } from "@pmate/meta"
import { atom, useAtomValue, useSetAtom } from "jotai"
import { atomFamily } from "jotai/utils"
import { isEqual } from "lodash"
import { runPrompt as runPromptSDK } from "@pmate/sdk"
import { currentPromptAtom } from "@/atom/savePromptAtom"

interface PromptParams {
  prompt?: Prompt
  variables: Record<string, unknown>
}

export const promptResultAtom = atomFamily((_params: PromptParams) => {
  return atom<unknown>(null)
}, isEqual)

const setPromptResultAtom = atom(
  null,
  (_, set, params: PromptParams, value: unknown) => {
    set(promptResultAtom(params), value)
  }
)

export const useRunPrompt = () => {
  const prompt = useAtomValue(currentPromptAtom)
  const setResult = useSetAtom(setPromptResultAtom)

  return async (
    variables: Record<string, unknown>,
    promptOverride?: Prompt
  ) => {
    const activePrompt = promptOverride ?? prompt
    if (!activePrompt) {
      return
    }

    activePrompt.variables?.forEach((variable: PromptVariable) => {
      const isRequired = variable.required ?? true
      if (!isRequired) {
        return
      }
      const value = variables[variable.name]
      if (
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "")
      ) {
        throw new Error(`Missing variable: ${variable.name}`)
      }
    })

    const params = {
      prompt: activePrompt,
      variables,
    }

    const result = await runPromptSDK(activePrompt.key as PromptKeys, variables)
    setResult(params, result)
    return result
  }
}
