import { forwardRef, ChangeEvent, InputHTMLAttributes } from "react"
import { useTranslation } from "@pmate/i18n"
import { Button } from "../Button"

interface NicknameSelectorProps extends InputHTMLAttributes<HTMLInputElement> {
  value?: string
}

const baseButtonClass =
  "w-[6rem] h-[2.25rem] rounded-[2rem] text-[0.875rem] transition-all"

const groupContainerClass =
  "mt-[0.75rem] text-[0.875rem] flex justify-center flex-wrap gap-x-[0.625rem]"

export const NicknameSelector = forwardRef<HTMLInputElement, NicknameSelectorProps>(
  ({ value, defaultValue, onChange, name, className, ...rest }, ref) => {
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

    const handleSelect = (candidate: string) => {
      const syntheticEvent = {
        target: { value: candidate, name },
      } as unknown as ChangeEvent<HTMLInputElement>
      onChange?.(syntheticEvent)
    }

    return (
      <div
        className={["flex flex-col gap-y-[1.25rem]", className]
          .filter(Boolean)
          .join(" ")}
      >
        <input
          type="hidden"
          value={selected}
          name={name}
          ref={ref}
          {...rest}
        />

        {nicknameGroups.map((group) => (
          <div key={group.title}>
            <div className="ml-[3.1rem] text-[1.125rem] text-white">
              {group.title}
            </div>
            <div className={groupContainerClass}>
              {group.names.map((candidate) => (
                <Button
                  key={candidate}
                  className={[
                    baseButtonClass,
                    selected === candidate ? "ring-2 ring-white" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  variant={group.variant}
                  onClick={() => handleSelect(candidate)}
                >
                  {candidate}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }
)
