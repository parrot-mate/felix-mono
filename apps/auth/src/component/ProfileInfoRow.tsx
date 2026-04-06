import { IconButton, IconEdit } from "@pmate/uikit"
import { ReactNode } from "react"

interface ProfileInfoRowProps {
  icon: ReactNode
  label: string | ReactNode
  value?: ReactNode
  children?: ReactNode
  onEdit?: () => void
  className?: string
  editIcon?: ReactNode
  paddingClassName?: string
  labelClassName?: string
  valueClassName?: string
  editAriaLabel?: string
}

export const ProfileInfoRow = ({
  icon,
  label,
  value,
  children,
  onEdit,
  className,
  editIcon,
  paddingClassName = "py-3 px-3",
  labelClassName = "text-gray-900",
  valueClassName = "text-gray-700",
  editAriaLabel = "edit",
}: ProfileInfoRowProps) => {
  const canEdit = typeof onEdit === "function"

  return (
    <div
      className={[
        "grid grid-cols-[1.25rem_1fr_auto] items-start gap-[0.1rem]",
        paddingClassName,
        className || "",
      ].join(" ")}
      role={canEdit ? "button" : undefined}
      onClick={canEdit ? onEdit : undefined}
    >
      <span className="text-[0.7rem] leading-6 select-none">{icon}</span>
      <div className="min-w-0 text-sm">
        {children ? (
          <div className="flex flex-wrap gap-2 items-center">
            <span className={labelClassName}>{label}:</span>
            {children}
          </div>
        ) : (
          <div className="flex items-center">
            <span className={labelClassName}>{label}:</span>
            <span className={`ml-1 min-w-0 truncate ${valueClassName}`}>
              {value}
            </span>
          </div>
        )}
      </div>

      <IconButton
        className="-mr-1 w-full h-full flex items-center justify-center"
        onClick={(e) => {
          e.stopPropagation()
          if (canEdit) onEdit?.()
        }}
        aria-label={editAriaLabel}
        disabled={!canEdit}
      >
        {editIcon || <IconEdit className="w-3 h-3 text-violet-500" />}
      </IconButton>
    </div>
  )
}
