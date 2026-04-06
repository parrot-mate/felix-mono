import { atom, useAtom } from "jotai"
import { useCallback, useState } from "react"

interface AlertState {
  type: "success" | "info" | "warning" | "error"
  message: string
}

const alertAtom = atom<AlertState>({
  type: "info",
  message: "",
})

export const useShowAlert = () => {
  const [state, setState] = useAtom(alertAtom)
  const [alertState, setAlertState] = useState<AlertState>({
    type: "info",
    message: "",
  })

  const show = useCallback(
    (type: "success" | "info" | "warning" | "error", message: string) => {
      setState({ type, message })
      setTimeout(() => {
        setState({ type: "info", message: "" })
      }, 3000)
    },
    []
  )

  return show
}

export const useDisplayAlert = () => {
  const [state, setState] = useAtom(alertAtom)
  return state
}
