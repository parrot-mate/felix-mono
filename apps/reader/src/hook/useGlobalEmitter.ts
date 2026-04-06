import { createContext, useContext } from "react"
import { Emitter } from "@pmate/utils"
export const useGlobalEmitter = () => {
  const emiter = useContext(GlobalEmitterContext)!
  return emiter
}

export const GlobalEmitterContext = createContext<Emitter<string> | null>(
  null as any
)
