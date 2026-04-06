import { atom } from "jotai"
import { atomFamily } from "jotai/utils"
import { getDefaultPrompt } from "@sdk/api"

export const defaultPromptAtom = atomFamily((key: string) => {
  return atom(async () => {
    return getDefaultPrompt(key)
  })
})