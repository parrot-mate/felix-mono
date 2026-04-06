import { globalReadingStateAtom } from "@/atom/reading/globalReadingStateAtom"
import { Logger } from "@pmate/utils"
import { bookAtom, useBook } from "@pmate/sdk"
import { useAtomValue } from "jotai"
import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router"

const logger = Logger.getDebugger("GlobalReadingStateRestore")
export const GlobalReadingStateRestore = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [checked, setChecked] = useState(false)
  const globalState = useAtomValue(globalReadingStateAtom)
  const restored = useRef(false)
  const nav = useNavigate()
  const id = useBook()
  const book = useAtomValue(bookAtom(id)).unwrap()

  useEffect(() => {
    const state = globalState.unwrapOr(null)
    logger.log("effect", state)
    if (restored.current) {
      return
    }
    logger.log("state", state)
    const pageNo = book

    if (state) {
      if (state.id) {
        const pageNo = book.paragraphsPageMap.get(state.pid)
        nav(`/reader/punchmode/${state.id}/${pageNo}`)
      }
      restored.current = true
    }
    setChecked(true)
  }, [globalState.toBoolean()])
  if (!checked) {
    return null
  }
  return children
}
