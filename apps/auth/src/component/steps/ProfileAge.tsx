import { useTranslation } from "@pmate/account-sdk"
import { InputField } from "@pmate/uikit"
import { ProfileStepComponentProps } from "./types"

type ProfileAgeProps = ProfileStepComponentProps<number | undefined>

const normalizeAge = (value: string) => {
  if (value.trim() === "") {
    return undefined
  }
  const next = Number.parseInt(value, 10)
  if (Number.isNaN(next)) {
    return undefined
  }
  return Math.max(0, next)
}

export const ProfileAge = ({ value, onChange }: ProfileAgeProps) => {
  const t = useTranslation()
  const displayValue = value === undefined ? "" : String(value)

  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-6">
      <div className="text-white text-lg font-semibold">
        {t("Please enter your age")}
      </div>
      <InputField
        type="number"
        min={0}
        inputMode="numeric"
        className="w-[14rem] h-[3rem] pl-[1rem] text-center"
        placeholder={t("Age")}
        value={displayValue}
        onChange={(event) => onChange(normalizeAge(event.target.value))}
      />
    </div>
  )
}
