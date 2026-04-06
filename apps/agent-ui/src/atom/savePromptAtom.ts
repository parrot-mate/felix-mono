import { Prompt } from "@pmate/meta"
import {
  Api,
  promptsAtom,
  updateConfigVersionAtom,
  updatedConfigAtom,
} from "@pmate/sdk"
import { atom, type PrimitiveAtom } from "jotai"

const getAdminEndpoint = () => {
  const endpoint = process.env.VITE_PUBLIC_CMS_SERVICE
  if (!endpoint) {
    throw new Error("VITE_PUBLIC_CMS_SERVICE is not configured")
  }
  return endpoint.replace(/\/+$/, "")
}

const mergePrompt = (collection: Prompt[], prompt: Prompt) => {
  const exists = collection.find((item) => item.key === prompt.key)
  if (!exists) {
    return [...collection, prompt]
  }
  return collection.map((item) => (item.key === prompt.key ? prompt : item))
}

const removePromptByKey = (collection: Prompt[], key: string) => {
  return collection.filter((item) => item.key !== key)
}

export const selectedPromptAtom = atom<string | undefined>()

export const currentPromptAtom = atom((get) => {
  const selected = get(selectedPromptAtom)
  const promptMap = get(promptsAtom)
  if (!selected) {
    return undefined
  }
  return promptMap[selected]
})

const updateConfigVersionPrimitive: PrimitiveAtom<number> =
  updateConfigVersionAtom

export const resetPromptAtom = atom(null, async (get, set, prompt: Prompt) => {
  const updatedConfig = get(updatedConfigAtom)
  const endpoint = getAdminEndpoint()
  const nextPrompts = removePromptByKey(updatedConfig, prompt.key)

  await Api.put(`${endpoint}/prompt-config`, { prompts: nextPrompts })

  set(updateConfigVersionPrimitive, (prev) => prev + 1)
})

export const savePromptAtom = atom(null, async (get, set, prompt: Prompt) => {
  const updatedConfig = get(updatedConfigAtom)
  const prompts = mergePrompt(updatedConfig, prompt)
  const endpoint = getAdminEndpoint()

  await Api.put(`${endpoint}/prompt-config`, { prompts })

  set(updateConfigVersionPrimitive, (prev) => prev + 1)
})
