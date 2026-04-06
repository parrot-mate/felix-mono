import {
  PropsWithChildren,
  createContext,
  useContext,
  useMemo,
} from "react"
import type { CombinedResourceInput } from "./useCombinedResourceController"
import { useCombinedResourceController } from "./useCombinedResourceController"

type CombinedResourceContextValue = ReturnType<
  typeof useCombinedResourceController
> & {
  entries: CombinedResourceInput[]
}

const CombinedResourceContext =
  createContext<CombinedResourceContextValue | null>(null)

export const CombinedResourceProvider = ({
  value = [],
  children,
}: PropsWithChildren<{ value?: CombinedResourceInput[] }>) => {
  const entries = value ?? []
  const resourceValue = useCombinedResourceController(entries)

  const contextValue = useMemo<CombinedResourceContextValue>(
    () => ({
      ...resourceValue,
      entries,
    }),
    [entries, resourceValue]
  )

  return (
    <CombinedResourceContext.Provider value={contextValue}>
      {children}
    </CombinedResourceContext.Provider>
  )
}

export const useCombinedResourceContext = () => {
  const ctx = useContext(CombinedResourceContext)
  if (!ctx) {
    throw new Error(
      "useCombinedResourceContext must be used within CombinedResourceProvider"
    )
  }
  return ctx
}
