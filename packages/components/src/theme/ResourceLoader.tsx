import { FC, createContext, useContext, useEffect } from "react"
import { atom, useAtomValue } from "jotai"
import { Dict } from "@pmate/meta"
import { zhCNDictAtom } from "@/atom/resAtoms"

interface ResourceLaderProps {
  children: React.ReactNode
}

const ResourcesContext = createContext<{
  zhCNDict: Dict
}>({
  zhCNDict: {} as Dict,
})

export const useResources = () => {
  const context = useContext(ResourcesContext)
  return context
}
export const ResourceLoader: FC<ResourceLaderProps> = ({ children }) => {
  const zhCNDict = useAtomValue(zhCNDictAtom)

  return (
    <ResourcesContext.Provider
      value={{
        zhCNDict,
      }}
    >
      {children}
    </ResourcesContext.Provider>
  )
}
