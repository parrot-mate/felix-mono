import { rtcConnectedAtom, threadMessagesV2Atom } from "@sdk/atom"
import { ThreadUtils } from "@sdk/util/ThreadUtils"
import { useAtomValue, useSetAtom } from "jotai"
import { useEffect } from "react"

export const useRefreshThreadOnConnect = (
  userId: string,
  threadHash: string
) => {
  const isConnected = useAtomValue(rtcConnectedAtom(userId))
  const entityId = ThreadUtils.resolveEntityId(threadHash, userId)
  const loadThreadMessages = useSetAtom(
    threadMessagesV2Atom({ entityId, threadHash })
  )

  useEffect(() => {
    if (!isConnected) {
      return
    }
    loadThreadMessages({ type: "loadNewer" })
  }, [isConnected, loadThreadMessages, threadHash])
}
