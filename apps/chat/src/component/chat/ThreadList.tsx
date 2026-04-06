import { useTranslation } from "@pmate/i18n"
import type { ThreadInfoV2 } from "@pmate/meta"
import { ThreadListView } from "@pmate/uikit"
import { useAtom, useAtomValue } from "jotai"
import { useEffect } from "react"
import { useNavigate } from "react-router"

import { profileAtom } from "@pmate/account-sdk"
import { threadsAtomV2 } from "@pmate/sdk"
import { MicProvider } from "@/provider/MicContextProvider"
import { useMicContext } from "@/hook/useMicContext"
import { useSplashScreen } from "@/hooks/useSplashScreen"

const ThreadListContent = () => {
  const t = useTranslation()
  const profile = useAtomValue(profileAtom)
  const me = profile?.id ?? ""
  const [threadMap, refreshThreads] = useAtom(threadsAtomV2(me ?? ""))
  const nav = useNavigate()
  const { closeSplashScreen, isSplashScreenVisible } = useSplashScreen()
  const { manager: micManager } = useMicContext()

  useEffect(() => {
    refreshThreads()
  }, [refreshThreads, me])

  const items = Object.values(threadMap).sort(
    (a, b) => b.lastUpdateAt - a.lastUpdateAt
  )

  useEffect(() => {
    if (items.length > 0 && isSplashScreenVisible()) {
      closeSplashScreen(200)
    }
  }, [items.length, closeSplashScreen, isSplashScreenVisible])

  const handleSelect = (item: ThreadInfoV2) => {
    micManager
      .warmUp()
      .catch((error) => {
        console.error("Mic warm up failed", error)
      })
      .finally(() => {
        if (item.type === "group") {
          nav(`/chat/group/${item.associatedId}`)
          return
        }
        if (!me) {
          return
        }
        nav(`/chat/dm/${item.associatedId}`)
      })
  }

  return (
    <ThreadListView
      className="w-full h-full bg-[#F9FAFB] overflow-auto"
      threads={items}
      noDataText={t("No Chats") as string}
      onSelect={handleSelect}
    />
  )
}

export const ThreadList = () => (
  <MicProvider id="chat">
    <ThreadListContent />
  </MicProvider>
)
