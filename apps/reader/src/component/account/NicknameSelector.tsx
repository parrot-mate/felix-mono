import { useTranslation } from "@pmate/i18n"
import { Button } from "@pmate/uikit"
import clsx from "clsx"
import React from "react"

interface NicknameSelectorProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  value?: string
  defaultValue?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export const NicknameSelector = React.forwardRef<
  HTMLInputElement,
  NicknameSelectorProps
>(({ value, defaultValue, onChange, name, className, ...restProps }, ref) => {
  const t = useTranslation()

  const nicknameGroups = [
    {
      title: t("male"),
      variant: "secondary" as const,
      names: ["Leo", "Eric", "Jason"],
    },
    {
      title: t("female"),
      variant: "accent" as const,
      names: ["Lily", "Emma", "Mia"],
    },
    {
      title: t("popular neutral"),
      variant: "plain" as const,
      names: ["Alex", "Jamie", "Taylor"],
    },
  ]

  const selected = value ?? defaultValue ?? ""

  const handleSelect = (nameValue: string) => {
    const fakeEvent = {
      target: { value: nameValue, name },
    } as unknown as React.ChangeEvent<HTMLInputElement>
    onChange?.(fakeEvent)
  }

  return (
    <div className={clsx("flex flex-col gap-y-[1.25rem]", className)}>
      <input
        type="hidden"
        value={selected}
        name={name}
        ref={ref}
        {...restProps}
      />

      {nicknameGroups.map((group) => (
        <div key={group.title}>
          <div className="ml-[3.1rem] text-[1.125rem] text-white">
            {group.title}
          </div>
          <div className="mt-[0.75rem] text-[0.875rem] flex justify-center flex-wrap gap-x-[0.625rem]">
            {group.names.map((name) => (
              <Button
                key={name}
                className={clsx(
                  "w-[6rem] h-[2.25rem] rounded-4xl text-[0.875rem]",
                  selected === name && "ring-2 ring-white"
                )}
                variant={group.variant}
                onClick={() => handleSelect(name)}
              >
                {name}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
})
