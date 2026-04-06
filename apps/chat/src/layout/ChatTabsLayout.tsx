import { safeInsetsNativeAtom } from "@/atom/safeInsestsAtom"
import { chatTabAtom } from "@/atom/ui/chatTabAtom"
import { GlobalLoading } from "@/component/GlobalLoading"
import { Logger } from "@pmate/utils"
import { useTranslation } from "@pmate/i18n"
import { BottomNavBar, IconDiscover, IconMe, IconMessage, IconStudy } from "@pmate/uikit"
import { usePrevious } from "@uidotdev/usehooks"
import { useAtom, useAtomValue } from "jotai"
import { ReactNode, Suspense, useEffect, useMemo } from "react"
import { useLocation, useNavigate } from "react-router"

const logger = Logger.getDebugger("ChatTabsLayout")
export const ChatTabsLayout = ({ children }: { children: ReactNode }) => {
  return (
    <Suspense fallback={<GlobalLoading />}>
      {children}
      <BottomBar />
    </Suspense>
  )
}

const BottomBar = () => {
  const [tab, setTab] = useAtom(chatTabAtom)
  const nav = useNavigate()
  const location = useLocation()
  const prevTab = usePrevious(tab)
  const t = useTranslation()
  const safeInsets = useAtomValue(safeInsetsNativeAtom)
  const items = [
    {
      value: "/",
      label: t("Message"),
      icon: (
        <IconMessage
          className={`w-7 h-7 ${
            tab === "/" ? "text-violet-500" : "text-gray-400"
          }`}
        />
      ),
    },
    {
      value: "/coming-soon",
      label: t("Study"),
      icon: (
        <IconStudy
          className={`w-7 h-7 ${
            tab === "/coming-soon" ? "text-violet-500" : "text-gray-400"
          }`}
        />
      ),
    },
    {
      value: "/coming-soon",
      label: t("Discover"),
      icon: (
        <IconDiscover
          className={`w-7 h-7 ${
            tab === "/coming-soon" ? "text-violet-500" : "text-gray-400"
          }`}
        />
      ),
    },
    {
      value: "/coming-soon",
      label: t("Me"),
      icon: (
        <IconMe
          className={`w-7 h-7 ${
            tab === "/coming-soon" ? "text-violet-500" : "text-gray-400"
          }`}
        />
      ),
    },
  ]

  useEffect(() => {
    if (location.pathname !== tab) {
      setTab(location.pathname)
    }
  }, [location.pathname, tab, setTab])

  return (
    <BottomNavBar
      value={tab}
      onChange={(value) => {
        nav(value)
      }}
      items={items}
    />
  )
}
