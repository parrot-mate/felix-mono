import { useTranslation } from "@pmate/account-sdk"
import { getLangFull } from "@pmate/lang"
import { InputField } from "@pmate/uikit"
import { NicknameSelector } from "@pmate/uikit"
import { ProfileStepComponentProps } from "./types"

type ProfileNicknameProps = ProfileStepComponentProps<string>

export const ProfileNickname = ({
  value,
  onChange,
  draft,
}: ProfileNicknameProps) => {
  const t = useTranslation()
  const langShort = draft.learningTargetLang || "en"

  return (
    <div className="h-full w-full">
      <div className="mt-[0.68rem] pb-[0.56rem] text-[1.5rem] text-white font-bold text-center">
        {t(`Your {{langShort}} name`, {
          langShort: t(getLangFull(langShort)),
        })}
      </div>
      <div className="ml-[1.875rem] pb-[0.56rem] text-[0.875rem] text-gray-50 font-normal">
        {t("Create your own name or choose from the recommendations")}
      </div>
      <div className="flex flex-col items-center">
        <InputField
          type="text"
          placeholder={t("Enter your nickname here...")}
          className="w-[22rem] h-[3rem] pl-[1rem]"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      <NicknameSelector
        className="mt-[1.5rem]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
