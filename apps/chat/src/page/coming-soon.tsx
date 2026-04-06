import { ChatHomeTitleBar } from "@/component/chat/ChatHomeTitleBar"
import { Page } from "@/component/Page"
import { useTranslation } from "@pmate/i18n"
import { Button } from "@pmate/uikit"
import { useNavigate } from "react-router"

export const ComingSoonPage = () => {
  const t = useTranslation()
  const nav = useNavigate()

  return (
    <Page>
      <ChatHomeTitleBar />
      <div className="flex flex-col items-center justify-center flex-1">
        <div className="flex flex-col items-center justify-center mb-[5.8rem]">
          <div className="flex flex-col space-y-[0.1rem]">
            <div className="w-[3.6rem] h-[1.2rem] bg-gradient-to-r from-rose-400 to-violet-500 rounded-tl-[0.5rem] rounded-tr-[0.5rem]"></div>
            <div className="w-[3.6rem] h-[1.2rem] bg-gradient-to-r from-rose-400 to-violet-500 rounded-bl-[0.5rem] rounded-br-[0.5rem]"></div>
          </div>
        </div>

        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          {t("coming soon")}
        </h2>
        <p className="text-sm text-gray-500">{t("This feature is under")}</p>
        <p className="text-sm text-gray-500 mb-8">{t("development")}</p>

        <Button
          onClick={() => nav(-1)}
          className="w-[12rem] px-8 py-2 rounded-full text-white font-medium bg-gradient-to-r from-rose-400 to-violet-500 hover:opacity-90 transition-opacity"
        >
          {t("Back")}
        </Button>
      </div>
    </Page>
  )
}

export default ComingSoonPage
