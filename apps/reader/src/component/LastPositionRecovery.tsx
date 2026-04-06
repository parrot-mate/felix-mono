import { globalReadingStateAtom } from "@/atom/reading/globalReadingStateAtom"
import { useAtomValue } from "jotai"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router"

export const LastPositionRecovery = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const globalState = useAtomValue(globalReadingStateAtom)
  const [check, setCheck] = useState(false)
  const nav = useNavigate()

  useEffect(() => {
    if (!check) {
      if (globalState.isJust()) {
        const state = globalState.unwrap()
        if (state.id && state.pid > 0) {
          // nav(`/reader/TearMode/${state.id}/${state.pid}`)
        }
      }
      requestAnimationFrame(() => {
        setCheck(true)
      })
    }
  }, [check])

  if (!check) {
    return null
  }

  return children
}
