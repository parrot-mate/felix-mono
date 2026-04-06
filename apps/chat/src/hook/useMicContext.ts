import { useContext } from "react"

import { MicContext } from "@/provider/MicContextProvider"

export const useMicContext = () => {
  const context = useContext(MicContext)
  if (!context) {
    throw new Error("Mic hooks must be used within a MicProvider")
  }
  return context
}
