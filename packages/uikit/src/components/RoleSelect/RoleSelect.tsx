import type { UserRole } from "@pmate/meta"
import clsx from "clsx"
import React from "react"
import { Button } from "../Button"

interface RoleSelectProps {
  value?: UserRole
  onChange: (role: UserRole) => void
  t: (key: string) => string
}

export const RoleSelect: React.FC<RoleSelectProps> = ({ onChange, t }) => {
  const options: { key: UserRole; title: string; desc: string }[] = [
    {
      key: "practitioner" as UserRole,
      title: t("Practitioner"),
      desc: t("I want to practice languages and chat with others"),
    },
    {
      key: "mate" as UserRole,
      title: t("Mate"),
      desc: t("I can guide language learning and provide companionship"),
    },
  ]

  return (
    <div className="flex items-center justify-center" data-uikit="role_select">
      <div className="flex flex-col w-[22rem]">
        {options.map((opt) => (
          <Button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            variant={opt.key === "practitioner" ? "primary" : "accent"}
            className={clsx(
              "w-full h-[9.375rem] rounded-2xl text-white text-left pl-[1.56rem] pt-[1.875rem] mb-[1.875rem]",
              "flex flex-col items-start" // 按钮内上下布局
            )}
          >
            <span className="text-[1.25rem] font-bold tracking-[-0.01375rem]">
              {opt.title}
            </span>
            <span className="text-[0.875rem] font-normal mt-[0.375rem] tracking-[-0.009625rem]">
              {opt.desc}
            </span>
          </Button>
        ))}
      </div>
    </div>
  )
}
