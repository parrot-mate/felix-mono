import { LangShort, LangShorts } from "@pmate/meta"
import { useTranslation } from "@pmate/i18n"
import { Button } from "@pmate/uikit"
import clsx from "clsx"
import React from "react"
import { getLangFull } from "@pmate/lang"

interface LangSelectorProps {
  value?: LangShort
  defaultValue?: LangShort
  onChange?: (val: LangShort) => void
  className?: string
}

export const LangSelector: React.FC<LangSelectorProps> = ({
  value,
  defaultValue,
  onChange,
  className,
}) => {
  const t = useTranslation()
  const selected = value ?? defaultValue ?? null

  const handleClick = (lang: LangShort) => {
    onChange?.(lang)
  }

  const perRow = 2
  const rows: JSX.Element[] = []

  for (let i = 0; i < LangShorts.length; i += perRow) {
    const row = (
      <div
        key={i}
        className="flex items-center justify-center mb-[1rem] ml-[1.56rem]"
      >
        {LangShorts.slice(i, i + perRow).map((lang) => (
          <Button
            key={lang}
            variant="secondary"
            className={clsx(
              "w-[9.06rem] h-[2.75rem] text-[1rem] mb-4",
              i % perRow === 0 && "mr-[1.56rem]",
              selected === lang && "ring-2 ring-white"
            )}
            onClick={() => handleClick(lang)}
          >
            {t(getLangFull(lang))}
          </Button>
        ))}
      </div>
    )
    rows.push(row)
  }

  return <div className={className}>{rows}</div>
}
