import { Prompt } from "@pmate/meta"
import { Api } from "@pmate/sdk"
import { atom } from "jotai"

export const getCmsServiceEndpoint = () => {
  const endpoint = process.env.VITE_PUBLIC_CMS_SERVICE
  if (!endpoint) {
    throw new Error("VITE_PUBLIC_CMS_SERVICE is not configured")
  }
  return endpoint.replace(/\/+$/, "")
}

export const updatePromptAtom = atom(
  null,
  async (_get, _set, prompt: Prompt) => {
    const endpoint = getCmsServiceEndpoint()
    await Api.put(`${endpoint}/prompt`, { prompt })
  }
)
