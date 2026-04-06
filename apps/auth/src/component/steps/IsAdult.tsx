import { useTranslation } from "@pmate/account-sdk"
import { ProfileStepComponentProps } from "./types"

type IsAdultProps = ProfileStepComponentProps<boolean | undefined>

const getOptionClassName = (active: boolean) =>
  [
    "flex items-center justify-center h-12 w-48 rounded-full text-base font-semibold",
    "border transition-colors",
    active
      ? "border-primary bg-primary text-white"
      : "border-gray-500 bg-grey-100 text-gray-700",
  ].join(" ")

export const IsAdult = ({ value, onChange }: IsAdultProps) => {
  const t = useTranslation()

  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-6 pt-10">
      <div className="text-white text-lg font-semibold">
        {t("Are you 18 or older?")}
      </div>
      <div className="flex flex-col items-center gap-4">
        <button
          type="button"
          className={getOptionClassName(value === true)}
          onClick={() => onChange(true)}
        >
          {t("Yes")}
        </button>
        <button
          type="button"
          className={getOptionClassName(value === false)}
          onClick={() => onChange(false)}
        >
          {t("No")}
        </button>
      </div>
    </div>
  )
}
