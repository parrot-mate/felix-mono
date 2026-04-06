import { useTranslation } from "@pmate/i18n"
import type { Profile } from "@pmate/meta"
import clsx from "clsx"
import type { BaseComponentProps } from "../../types/base"
import { Avatar } from "../Avatar"
import { IconMate, IconPlayer, IconPlus } from "../../icons"

export interface ProfileSelectorProps extends BaseComponentProps {
  profiles: Profile[]
  value?: string
  defaultValue?: string
  onChange?: (id: string) => void
}

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({
  profiles,
  onChange,
  className,
  id,
  styles
}) => {
  const t = useTranslation()

  const handleSelect = (v: string) => {
    onChange?.(v)
  }

  return (
    <div
      id={id}
      data-uikit="profile_selector"
      style={styles}
      className={clsx("flex flex-col", className)}
    >
      {profiles.map((p) => {
        const roleIcon = p.role === "practitioner"
        const borderColor = p.role === "practitioner"
        const displayName = (p.nickName || p.name)
        return (
          <div
            key={p.id}
            className={clsx(
              "flex items-center cursor-pointer relative mb-[2rem]"
            )}
            onClick={() => handleSelect(p.id)}
          >
            <Avatar
              src={p.avatar}
              nickName={p.nickName || p.name}
              size="medium"
              className={clsx(
                "border-2 rounded-full",
                borderColor
                  ? "border-violet-500"
                  : "border-rose-400"
              )}
              badgeIcon={
                roleIcon ? (
                  <IconPlayer className="w-[1.25rem] h-[1.25rem]" />
                ) : (
                  <IconMate className="w-[1.25rem] h-[1.25rem]" />
                )
              }
            />
            <span className="flex-1 truncate pl-4 text-[0.8rem]">{displayName}</span>
          </div>
        )
      })}
      <div
        className="flex items-center cursor-pointer mb-[1.5rem]"
        onClick={() => handleSelect("__add__")}
      >
        <div className="w-[2.2rem] h-[2.2rem] rounded-full border border-gray-300 flex items-center justify-center bg-gray-300 text-white">
          <IconPlus  />
        </div>
        <span className="flex-1 truncate pl-4 text-[0.8rem]">{t("Add Profile")}</span>
      </div>
    </div>
  )
}
