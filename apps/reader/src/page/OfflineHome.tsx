import { useTranslation } from "@pmate/i18n"
import { MyBooks } from "./browser/MyBooks"

// let once = false
export const OfflineHome = () => {
  const t = useTranslation()
  return (
    <div className="p-[20px]">
      <h1>{t("Offline mode")}</h1>
      <MyBooks />
    </div>
  )
}
