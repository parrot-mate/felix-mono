import { atom } from "jotai"
import { unwrap } from "jotai/utils"
import { fetchPromptConfig } from "./promptConfig"

export const defaultConfigAtom = unwrap(
  atom(async () => {
    return fetchPromptConfig("default.json")
  }),
  () => []
)
