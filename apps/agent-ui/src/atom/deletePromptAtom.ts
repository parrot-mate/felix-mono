import { Api } from "@pmate/sdk"
import { atom } from "jotai"
import { getCmsServiceEndpoint } from "./updatePromptAtom"

type DeletePromptPayload = {
  key: string
}

type DeletePromptResponse = {
  key: string
}

export const deletePromptAtom = atom(
  null,
  async (_get, _set, payload: DeletePromptPayload) => {
    const endpoint = getCmsServiceEndpoint()
    return Api.post<DeletePromptResponse>(`${endpoint}/prompt/delete`, payload)
  }
)
