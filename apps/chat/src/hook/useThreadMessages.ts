import { Logger, wait } from "@pmate/utils"
import { ThreadUtils, threadMessagesV2Atom, useRoomContext } from "@pmate/sdk"
import { useAtomValue, useSetAtom } from "jotai"
import { debounce } from "lodash"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

const LOCAL_PAGE_SIZE = 20

const logger = Logger.getDebugger("useThreadMessages")
export const useThreadMessages = () => {
  const { threadHash, me } = useRoomContext()
  const userId = me?.id ?? ""
  const [pageCount, setPageCount] = useState(1)

  useEffect(() => {
    setPageCount(1)
  }, [threadHash])

  const entityId = useMemo(
    () => ThreadUtils.resolveEntityId(threadHash, userId),
    [threadHash, userId]
  )
  const atomInstance = useMemo(() => {
    return threadMessagesV2Atom({ entityId, threadHash })
  }, [entityId, threadHash])

  const state = useAtomValue(atomInstance)
  const dispatch = useSetAtom(atomInstance)

  const allMessages = useMemo(() => {
    return state.pages
      .slice()
      .reverse()
      .flatMap((page) => page.messages)
  }, [state.pages])

  const visibleCount = useMemo(() => {
    return Math.min(allMessages.length, pageCount * LOCAL_PAGE_SIZE)
  }, [allMessages.length, pageCount])

  const messages = useMemo(() => {
    if (visibleCount === allMessages.length) {
      return allMessages
    }
    return allMessages.slice(allMessages.length - visibleCount)
  }, [allMessages, visibleCount])

  const hasLocalOlder = allMessages.length > visibleCount
  const hasPrevious = hasLocalOlder || state.hasPrevious
  const loading = useRef(false)

  const loadOlder = useCallback(
    debounce(async () => {
      try {
        if (loading.current) {
          return
        }
        loading.current = true
        if (!hasPrevious) {
          return
        }
        logger.log("loadOlder", "next page")
        const dataEnough =
          messages.length + LOCAL_PAGE_SIZE < allMessages.length
        setPageCount((prev) => prev + 1)
        if (dataEnough) {
          return
        }
        if (hasLocalOlder || !entityId || !threadHash || !state.hasPrevious) {
          return
        }
        dispatch({ type: "loadOlder" })
      } finally {
        await wait(1000)
        loading.current = false
      }
    }, 100),
    [
      dispatch,
      entityId,
      hasLocalOlder,
      hasPrevious,
      state.hasPrevious,
      threadHash,
      messages,
      allMessages,
      loading,
    ]
  )

  return {
    messages,
    hasPrevious,
    loadOlder,
  }
}
