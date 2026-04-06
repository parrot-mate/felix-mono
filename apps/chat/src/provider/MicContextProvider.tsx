import { createContext, PropsWithChildren, useEffect, useMemo } from "react"

import { micStateAtom, micStateManageAtom } from "@/atom/micStateAtom"
import {
  MicEvents,
  MicState,
  MicStateManage,
} from "@/component/chat/MicStateManage"
import { Logger } from "@pmate/utils"
import { useAtomValue, useSetAtom } from "jotai"

export interface MicContextValue {
  manager: MicStateManage
  id: string
}

const logger = Logger.getDebugger("MicContextProvider")
export const MicContext = createContext<MicContextValue | null>(null)

type MicProviderProps = PropsWithChildren<{
  id: string
}>

export const MicProvider = ({ id, children }: MicProviderProps) => {
  const sm = useAtomValue(micStateManageAtom(id))
  const setMicState = useSetAtom(micStateAtom(id))

  useEffect(() => {
    setMicState(sm.getState())
    const unsubscribe = sm.on(
      MicEvents.STATE_CHANGED,
      ({ state }: { state: MicState }) => {
        logger.log("state", MicState[state])
        setMicState(state)
      }
    )

    return () => {
      unsubscribe()
    }
  }, [sm, setMicState])

  useEffect(() => {
    sm.init()

    return () => {
      sm.dispose()
    }
  }, [sm])

  const value = useMemo(
    () => ({
      manager: sm,
      id,
    }),
    [sm, id]
  )

  return <MicContext.Provider value={value}>{children}</MicContext.Provider>
}
