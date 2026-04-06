import clsx from "clsx"
import React from "react"
import type { BaseComponentProps } from "../../types/base"

export interface BottomNavItem {
  value: string
  label: string
  icon: React.ReactNode
}

export interface BottomNavBarProps extends BaseComponentProps {
  items: BottomNavItem[]
  value: string
  onChange: (value: string) => void
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  items,
  value,
  onChange,
  className,
  styles,
  id,
}) => {
  return (
    <div
      id={id}
      style={styles}
      data-uikit="bottom-nav-bar"
      className={clsx(
        "fixed bottom-0 left-0 right-0 bg-white flex border-t border-gray-200 z-20 flex items-start pt-2 h-[4.5rem]",
        className
      )}
    >
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => onChange(item.value)}
          className={clsx(
            "flex-1 flex flex-col items-center justify-center text-sm w-[5.9rem]",
            value === item.value ? "text-violet-700 font-bold" : "text-gray-400"
          )}
        >
          <div>{item.icon}</div>
          <div>
            <span>{item.label}</span>
          </div>
        </button>
      ))}
    </div>
  )
}
