import { useEffect, useState } from "react"
import { useAtomValue } from "jotai"
import { vocabularyMapAtom } from "@sdk/atom/vocabularyMapAtom"
import { profileAtom } from "@pmate/account-sdk"
import { Logger } from "@pmate/utils"

const logger = Logger.getDebugger("useVolMarked")

export const useVolMarked = (word: string) => {
  const profile = useAtomValue(profileAtom)
  const userId = profile?.id ?? ""
  const vmap = useAtomValue(vocabularyMapAtom(userId || ""))
  const [marked, setMarked] = useState(vmap.search(word))

  useEffect(() => {
    return vmap.on("change", (changedWord: string) => {
      if (word === changedWord) {
        logger.log("changed", changedWord)
        setMarked(vmap.search(word))
      }
    })
  }, [vmap, word])

  return Boolean(marked)
}
