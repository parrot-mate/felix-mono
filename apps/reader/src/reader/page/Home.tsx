import { NotLogin } from "@/component/account/NotLogin"
import { useAtomValue } from "jotai"
import { useEffect } from "react"
import { useNavigate } from "react-router"
import { MyBooks } from "../../page/browser/MyBooks"
import { WelcomeCard } from "../components/WelcomeCard"

import { HomeTabsLayout } from "@/layout/HomeTabsLayout"

import { profileAtom } from "@pmate/account-sdk"
import { todayStatsAtom, totalStatsAtom, vocabularyMapAtom } from "@pmate/sdk"
import { useTranslation } from "@pmate/i18n"

// let once = false
export const Home = () => {
  const user = useAtomValue(profileAtom)
  const userId = user?.id ?? ""

  const nav = useNavigate()

  useEffect(() => {
    if (!userId) {
      nav("/")
    }
  }, [userId])
  const stats = useAtomValue(totalStatsAtom(userId))
  const trie = useAtomValue(vocabularyMapAtom(userId))
  const todayStats = useAtomValue(todayStatsAtom(userId))
  const t = useTranslation()

  return (
    <HomeTabsLayout>
      <div className="p-5">
        <NotLogin />
        <div className="flex items-center justify-center mt-5">
          <WelcomeCard
            user={user?.nickName || ""}
            text={t("Hi, {{nickName}}! Welcome!", {
              nickName: user?.nickName || "Guest",
            })}
            nw={trie.size()}
            reading={stats.wc}
            todayWc={todayStats.wc}
            i18n={{
              newWords: t("New words"),
              totalReading: t("Total reading"),
              todayReading: t("Today's reading"),
              wordUnit: t("Word"),
            }}
          />
        </div>
        <MyBooks />
      </div>
    </HomeTabsLayout>
  )
}
