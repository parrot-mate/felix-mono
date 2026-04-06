import type { UserReadMessageLog } from "@pmate/meta"
import { profileAtom } from "@pmate/account-sdk"
import { msgReportReadAtom } from "@pmate/sdk"
import { useAtomValue, useSetAtom } from "jotai"
import { useCallback } from "react"

export const useMessageReadReporter = () => {
  const profile = useAtomValue(profileAtom)
  const userId = profile?.id ?? ""
  const reportRead = useSetAtom(msgReportReadAtom)

  return useCallback(
    async ({
      hash,
      threadHash,
    }: Pick<UserReadMessageLog, "hash" | "threadHash">) => {
      try {
        await reportRead({
          user: userId,
          hash,
          threadHash,
        })
      } catch (error) {
        console.warn("Failed to report read message", error)
      }
    },
    [reportRead, userId]
  )
}
