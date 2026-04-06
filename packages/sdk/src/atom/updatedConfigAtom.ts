import { atom } from "jotai"
import { unwrap } from "jotai/utils"
import { fetchPromptConfig } from "./promptConfig"
import { updateConfigVersionAtom } from "./updateConfigVersionAtom"

export const updatedConfigAtom = unwrap(
  atom(async (get) => {
    get(updateConfigVersionAtom)
    return fetchPromptConfig("update.json")
  }),
  () => []
)
