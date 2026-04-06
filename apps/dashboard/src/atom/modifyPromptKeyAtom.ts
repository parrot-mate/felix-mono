import { Api } from "@pmate/sdk"
import { atom } from "jotai"
import { getCmsServiceEndpoint } from "./updatePromptAtom"

type ModifyPromptKeyPayload = {
  oldKey: string
  newKey: string
}

type ModifyPromptKeyResponse = {
  key: string
  version: number
}

export const modifyPromptKeyAtom = atom(
  null,
  async (_get, _set, payload: ModifyPromptKeyPayload) => {
    const endpoint = getCmsServiceEndpoint()
    return Api.post<ModifyPromptKeyResponse>(
      `${endpoint}/prompt/modify-key`,
      payload
    )
  }
)
