import type { ReactNode } from "react"

export interface TitleBarProps {
  title: string | ReactNode
  right?: ReactNode
  className?: string
}

export const TitleBar = ({ title, right, className }: TitleBarProps) => {
  return (
    <div className={["flex justify-between items-center", className].filter(Boolean).join(" ")}>
      {typeof title === "string" ? (
        <div className="text-gray-600">{title}</div>
      ) : (
        title
      )}
      <div>{right}</div>
    </div>
  )
}
