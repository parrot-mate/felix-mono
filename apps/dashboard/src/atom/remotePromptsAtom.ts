import { appendCacheBuster } from "@/util/cacheBusting"
import { Prompt } from "@pmate/meta"
import { Api } from "@pmate/sdk"
import { atom } from "jotai"
import { atomFamily } from "jotai/utils"

const RESOURCE_BASE = (
  process.env.VITE_PUBLIC_RESOURCE_URL ?? "https://book.skedo.cn"
).replace(/\/+$/, "")
const PROMPTS_BASE_URL = `${RESOURCE_BASE}/prompts`
const listUrl = `${PROMPTS_BASE_URL}/list.json`

const encodePromptKey = (key: string) => {
  return key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")
}

const createEmptyPrompt = (key: string): Prompt => ({
  key,
  title: "",
  model: "",
  messages: [],
  variables: [],
  resultType: "json",
  caching: false,
  version: 1,
})

const promptKeysRevisionAtom = atom(0)

export const promptKeysAtom = atom(
  async (get) => {
    get(promptKeysRevisionAtom)
    const list = await Api.getFile<string[]>(appendCacheBuster(listUrl))
    return list ?? []
  },
  (_get, set, action: { type: "refresh" }) => {
    if (action?.type === "refresh") {
      set(promptKeysRevisionAtom, (prev) => prev + 1)
    }
  }
)

export const promptDetailAtom = atomFamily((promptKey: string) => {
  const revisionAtom = atom(0)
  return atom(
    async (get) => {
      get(revisionAtom)
      const encodedKey = encodePromptKey(promptKey)
      const url = appendCacheBuster(`${PROMPTS_BASE_URL}/${encodedKey}.json`)
      const prompt = await Api.getFile<Prompt>(url)
      return prompt ?? createEmptyPrompt(promptKey)
    },
    (_get, set, action: { type: "refresh" }) => {
      if (action.type === "refresh") {
        set(revisionAtom, (prev) => prev + 1)
      }
    }
  )
})
