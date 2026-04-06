import { useTranslation } from "@pmate/account-sdk"
import type { LangShort } from "@pmate/meta"
import { LangSelector } from "@pmate/uikit"
import { ProfileStepComponentProps } from "./types"

type LearningLangProps = ProfileStepComponentProps<LangShort | undefined>

export const LearningLang = ({ value, onChange }: LearningLangProps) => {
  const t = useTranslation()

  return (
    <div className="h-full w-full">
      <div className="pt-[4rem] pb-[2.5rem] text-[1.5rem] text-white font-bold text-center">
        {t("Please select language what you want to learn")}
      </div>
      <LangSelector value={value} onChange={onChange} className="px-[1.875rem]" />
    </div>
  )
}
