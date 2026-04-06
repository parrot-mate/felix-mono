import { safeInsetsNativeAtom } from "@/atom/safeInsestsAtom"
import { getSafeInsets } from "@pmate/bridge"
import { IconButton, IconLeft } from "@pmate/uikit"
import clsx from "clsx"
import { atom, useAtomValue } from "jotai"
import React, { ReactNode } from "react"



export const ChatTitleBar = ({
  title,
  right,
  className,
  variant = 'gradient',
}: {
  title: string | ReactNode
  right?: React.ReactNode
  className?: string
  variant?: "gradient" | "solid"
}) => {
  const safeInsets = useAtomValue(safeInsetsNativeAtom)
  const showBack = typeof window !== "undefined" && window.history.length > 0
  const variantClass =
    variant === "gradient" ? "bg-gradient-parrot" : "bg-none bg-violet-500"
  return (
    <div
      className={clsx(
        "flex justify-between items-center pb-[13px] pl-[10px] pr-[10px]",
        variantClass,
        className
      )}
      style={{
        paddingTop: safeInsets ? `${safeInsets.top + 10}px` : `13px`,
      }}
    >
      {showBack ? (
        <IconButton
          onClick={() => {
            history.back()
          }}
          className="text-white"
        >
          <IconLeft />
        </IconButton>
      ) : (
        <div className="w-8" />
      )}
      {typeof title === "string" ? (
        <div className="text-white text-[1.25rem]">{title}</div>
      ) : (
        title
      )}
      <div className="flex items-center">{right}</div>
    </div>
  )
}
