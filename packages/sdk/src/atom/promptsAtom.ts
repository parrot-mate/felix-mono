import { atom } from "jotai"
import { keyBy } from "lodash"
import { defaultConfigAtom } from "./defaultConfigAtom"
import { updatedConfigAtom } from "./updatedConfigAtom"

export const promptsAtom = atom((get) => {
  const defaultConfig = get(defaultConfigAtom)
  const updatedConfig = get(updatedConfigAtom)

  const defaultMap = keyBy(defaultConfig, "key")
  const updateMap = keyBy(updatedConfig, "key")

  return {
    ...defaultMap,
    ...updateMap,
  }
})
