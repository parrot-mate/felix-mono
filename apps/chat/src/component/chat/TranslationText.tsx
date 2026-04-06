import { translateAtom } from "@/atom/aigen/translateAtom"
import { motherTongueAtom } from "@pmate/account-sdk"
import { LangShort } from "@pmate/meta"
import { Logger } from "@pmate/utils"
import { IconButton } from "@pmate/uikit"
import { useAtomValue, useSetAtom } from "jotai"
import { TextLoading } from "./TextLoading"
const logger = Logger.getDebugger("TranslationText")

const RefreshIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className="h-5 w-5"
    focusable="false"
  >
    <path
      d="M12 5a7 7 0 0 1 6.32 4h-1.9a5.1 5.1 0 1 0 .59 5h2.12A7 7 0 1 1 12 5Zm8 0v5h-5l1.8-1.8A6.9 6.9 0 0 0 12 4a7 7 0 0 1 9 6h-2a5 5 0 0 0-8.82-3.36Z"
      fill="currentColor"
    />
  </svg>
)

export const TranslationText = ({
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
  const userLangShort = useAtomValue(motherTongueAtom)
  console.log(`[translation]`, lang, targetLang, text)
  const params = {
    from: lang,
    to: targetLang || userLangShort,
    text,
    via: lang !== "en" && !lang.startsWith("zh") ? "accurate" : via,
    context,
  }
  const translation = useAtomValue(translateAtom(params))
  const retry = useSetAtom(translateAtom(params))

  if (translation.isFail()) {
    return (
      <IconButton
        onClick={() => {
          retry()
        }}
      >
        <RefreshIcon />
      </IconButton>
    )
  }

  if (translation.isPending()) {
    return <TextLoading />
  }
  return translation.value
}
