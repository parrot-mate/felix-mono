import { HomeTabsLayout } from "@/layout/HomeTabsLayout"

import { profileAtom } from "@pmate/account-sdk"
import { vocabularyAtom } from "@pmate/sdk"
import { useTranslation } from "@pmate/i18n"
import { formatDate } from "date-fns/format"
import { useAtomValue } from "jotai"

interface Vocabulary {
  word: string
  t: number
}
export const Vocabulary = () => {
  const profile = useAtomValue(profileAtom)
  const userId = profile?.id ?? ""
  const vols = useAtomValue(vocabularyAtom(userId))
  const list = Object.entries(vols).map((x) => x[1])
  const t = useTranslation()

  return (
    <HomeTabsLayout>
      <div className="p-[20px]">
        <table>
          <thead>
            <tr>
              <th>{t("Word")}</th>
              <th>{t("Date")}</th>
            </tr>
          </thead>
          <tbody>
            {list.map((vol, i) => {
              return (
                <tr key={i}>
                  <td>{vol.word}</td>
                  <td>{formatDate(vol.entryTime, "yyyy/MM/dd")}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </HomeTabsLayout>
  )
}
