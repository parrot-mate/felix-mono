import { useTranslation } from "@pmate/account-sdk"
import { IconFemale, IconMale } from "@pmate/uikit"
import { ProfileStepComponentProps } from "./types"

type ProfileGenderProps = ProfileStepComponentProps<"M" | "F" | undefined>

const getOptionClassName = (active: boolean, gender: "M" | "F") =>
  [
    "flex items-center justify-center gap-2 h-12 w-40 rounded-full text-base font-semibold",
    "border transition-colors",
    active
      ? gender === "F"
        ? "border-[#df5dad] bg-[#df5dad] text-white shadow-sm"
        : "border-sky-500 bg-sky-500 text-white shadow-sm"
      : "border-gray-200 bg-white text-gray-700",
  ].join(" ")

export const ProfileGender = ({ value, onChange }: ProfileGenderProps) => {
  const t = useTranslation()

  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-6 pt-10">
      <div className="text-white text-lg font-semibold">
        {t("Please select your gender")}
      </div>
      <div className="flex flex-col items-center gap-4">
        <button
          type="button"
          className={getOptionClassName(value === "F", "F")}
          onClick={() => onChange("F")}
        >
          <IconFemale className="h-5 w-5" />
          {t("Female")}
        </button>
        <button
          type="button"
          className={getOptionClassName(value === "M", "M")}
          onClick={() => onChange("M")}
        >
          <IconMale className="h-5 w-5" />
          {t("Male")}
        </button>
      </div>
    </div>
  )
}
