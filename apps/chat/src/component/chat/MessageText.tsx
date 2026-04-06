import { LangShort } from "@pmate/meta"
import { TranslationText } from "./TranslationText"
export const MessageText = ({
  text,
  lang,
  targetLang,
  via = "rough",
  context,
}: {
  text: string
  lang: LangShort
  targetLang?: LangShort
  via?: "rough" | "accurate"
  context?: string
}) => {
  return (
    <div className="rounded-2xl border-1 border-gray-200 p-2">
      <TranslationText
        text={text}
        lang={lang}
        targetLang={targetLang}
        via={via}
        context={context}
      />
    </div>
  )
}
