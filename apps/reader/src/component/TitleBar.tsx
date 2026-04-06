import { useTitlebar } from "@/hook/useTitlebar"
import React, { ReactNode } from "react"
import { useNavigate } from "react-router"

export const TitleBar = ({
  title,
  right,
  className,
}: {
  title: string | ReactNode
  right?: React.ReactNode
  className?: string
}) => {
  useTitlebar()
  const nav = useNavigate()
  return (
    <div className={`flex justify-between items-center ${className ?? ""}`}>
      {typeof title === "string" ? (
        <div className="text-gray-600">{title}</div>
      ) : (
        title
      )}
      <div>{right}</div>
    </div>
  )
}
