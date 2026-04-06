import { LangShort, LangShorts } from "@pmate/meta"
import { useTranslation } from "@pmate/account-sdk"
import { getLangFull } from "@pmate/lang"

interface LangSettingProps {
  value: LangShort
  onChange: (lang: LangShort) => void
  label?: string
}

export const LangSettingComponent = ({
  value,
  onChange,
  label,
}: LangSettingProps) => {
  const t = useTranslation()

  return (
    <div className="flex items-center w-full mb-4">
      <label className="flex-3 text-right shrink-0 mr-5">
        {label || t("Language")}:
      </label>
      <select
        className="flex-7 w-full border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        value={value}
        onChange={(event) => onChange(event.target.value as LangShort)}
      >
        {LangShorts.map((short) => {
          const label = t(getLangFull(short))
          const isLongLabel = label.length > 10
          return (
            <option
              key={short}
              value={short}
              className={isLongLabel ? "text-[0.85rem]" : ""}
            >
              {label}
            </option>
          )
        })}
      </select>
    </div>
  )
}
