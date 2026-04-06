import { Msg, MsgOp } from "@pmate/meta"

import { learningLangAtom, motherTongueAtom } from "@pmate/account-sdk"
import { useTranslation } from "@pmate/i18n"
import { useAtomValue } from "jotai"
import { useState } from "react"
import { TranslationText } from "../TranslationText"

export const MessageDetailCard = ({
  isMe,
  onClose,
  context,
  msg,
}: {
  msg: Msg<MsgOp.TEXT>
  isMe: boolean
  onClose: () => void
  context: string
}) => {
  const t = useTranslation()
  const learningLang = useAtomValue(learningLangAtom)
  const motherTong = useAtomValue(motherTongueAtom)
  const { text, lang } = msg.body
  const [showMotherTong, setShowMotherTong] = useState(false)
  
  return (
    <div className={isMe ? "ml-auto mr-[44px]" : "ml-[44px] mr-auto"}>
      <div
        className={`${
          !isMe ? "text-left" : "text-right"
        } border border-[#f3f3f3] px-[5px] py-[3px] text-[12px]`}
      >
        <TranslationText
          text={text}
          lang={lang}
          targetLang={learningLang}
          via="accurate"
          context={context}
        />
        {showMotherTong && (
          <TranslationText
            text={text}
            lang={lang}
            targetLang={motherTong}
            via="accurate"
            context={context}
          />
        )}
        <p>
          <button
            type="button"
            className="text-blue-500 mr-2 underline bg-transparent border-none p-0 cursor-pointer"
            onClick={() => setShowMotherTong(!showMotherTong)}
          >
            {showMotherTong ? t("Hide Translation") : t("Translate")}
          </button>
          <button
            type="button"
            className="text-blue-500 underline bg-transparent border-none p-0 cursor-pointer"
            onClick={onClose}
          >
            {t("Collapse")}
          </button>
        </p>
      </div>
    </div>
  )
}
