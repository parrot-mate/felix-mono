import { useState } from "react"
import { Button } from "@pmate/uikit"
import { LangShort } from "@pmate/meta"
import { useTranslation } from "@pmate/account-sdk"
import { LangSettingComponent } from "../LangSetting"

interface LearningLangFormProps {
  initialLang: LangShort
  onSuccess: (lang: LangShort) => void
}

export const LearningLangForm = ({
  initialLang,
  onSuccess,
}: LearningLangFormProps) => {
  const [lang, setLang] = useState<LangShort>(initialLang)
  const t = useTranslation()

  return (
    <>
      <LangSettingComponent
        label={t("Learning Language")}
        value={lang}
        onChange={setLang}
      />
      <Button variant="primary" onClick={() => onSuccess(lang)}>
        {t("Finish")}
      </Button>
    </>
  )
}
