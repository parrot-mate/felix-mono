import { Prompt } from "@pmate/meta"
import { Api } from "@pmate/sdk"
import { atom } from "jotai"
import { getCmsServiceEndpoint } from "./updatePromptAtom"

export type CreatePromptPayload = {
  key: string
  template?: Partial<Prompt>
}

export type CreatePromptResponse = {
  prompt: Prompt
}

export const createPromptAtom = atom(
  null,
  async (_get, _set, payload: CreatePromptPayload) => {
    const endpoint = getCmsServiceEndpoint()
    return Api.post<CreatePromptResponse>(`${endpoint}/prompt`, payload)
  }
)
