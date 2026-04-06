import { LangShorts } from "@pmate/meta"
import type { LangShort } from "@pmate/meta"
import { useTranslation } from "@pmate/i18n"
import { getLangFull } from "@pmate/lang"
import { Button } from "../Button"

interface LangSelectorProps {
  value?: LangShort
  defaultValue?: LangShort
  onChange?: (lang: LangShort) => void
  className?: string
}

export const LangSelector = ({
  value,
  defaultValue,
  onChange,
  className,
}: LangSelectorProps) => {
  const t = useTranslation()
  const selected = value ?? defaultValue ?? null

  const rows: JSX.Element[] = []
  const perRow = 2

  for (let index = 0; index < LangShorts.length; index += perRow) {
    const rowItems = LangShorts.slice(index, index + perRow)
    rows.push(
      <div
        key={index}
        className="flex items-center justify-center mb-4 ml-[1.56rem]"
      >
        {rowItems.map((lang, itemIndex) => {
          const label = t(getLangFull(lang))
          const isLongLabel = label.length > 10
          return (
            <Button
              key={lang}
              variant="secondary"
              className={[
                "w-[9.06rem] h-[2.75rem]",
                isLongLabel ? "text-[0.85rem]" : "text-[1rem]",
                itemIndex === 0 ? "mr-[1.56rem]" : "",
                selected === lang ? "ring-2 ring-white" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onChange?.(lang)}
            >
              {label}
            </Button>
          )
        })}
      </div>
    )
  }

  return <div className={className}>{rows}</div>
}
