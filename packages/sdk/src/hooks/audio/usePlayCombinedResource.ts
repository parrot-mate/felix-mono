import { useMemo } from "react"
import { useCombinedResourceContext } from "./CombinedResourceProvider"
import type { CombinedResourceInput } from "./useCombinedResourceController"

type CombinedResourceControls = ReturnType<
  typeof useCombinedResourceContext
>

const useCombinedResourceControls = (): CombinedResourceControls => {
  return useCombinedResourceContext()
}

export const useCombinedResource = () => {
  return useCombinedResourceControls()
}

export const useCombinedResourceEntry = (key?: string) => {
  const controls = useCombinedResourceControls()
  const entry = useMemo(() => {
    if (!key) {
      return undefined
    }
    return controls.entries.find((item) => item.key === key)
  }, [controls.entries, key])
  return entry
}

export const usePlayCombinedResource = (key?: string) => {
  const controls = useCombinedResourceControls()

  const entryIndex = useMemo(() => {
    if (!key) {
      return -1
    }
    return controls.entries.findIndex((entry) => entry.key === key)
  }, [controls.entries, key])

  return {
    ...controls,
    entryIndex,
  }
}

export type { CombinedResourceInput }
