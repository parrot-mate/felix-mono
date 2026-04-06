import React, { useEffect, useState } from "react"
import clsx from "clsx"
import type { BaseComponentProps } from "../../types/base"

export interface DrawerProps extends BaseComponentProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  anchor?: "left" | "right" | "top" | "bottom"
  overlayClassName?: string
}

export const Drawer: React.FC<DrawerProps> = ({
  open,
  onClose,
  children,
  anchor = "right",
  className,
  overlayClassName,
  id,
  styles,
}) => {
  const [mounted, setMounted] = useState(open)

  useEffect(() => {
    if (open) {
      setMounted(true)
    }
  }, [open])

  const handleTransitionEnd = () => {
    if (!open) {
      setMounted(false)
    }
  }

  if (!mounted) return null

  const positionClass = {
    left: "left-0 top-0 h-full",
    right: "right-0 top-0 h-full",
    top: "top-0 left-0 w-full",
    bottom: "bottom-0 left-0 w-full",
  }[anchor]

  const hiddenTransform = {
    left: "-translate-x-full",
    right: "translate-x-full",
    top: "-translate-y-full",
    bottom: "translate-y-full",
  }[anchor]

  return (
    <div
      id={id}
      data-uikit="drawer"
      className={clsx("fixed inset-0 z-[1002]", overlayClassName)}
      onClick={onClose}
    >
      <div
        className={clsx(
          "absolute bg-white transition-transform duration-300",
          positionClass,
          open ? "translate-x-0 translate-y-0" : hiddenTransform,
          className
        )}
        style={styles}
        onClick={(e) => e.stopPropagation()}
        onTransitionEnd={handleTransitionEnd}
      >
        {children}
      </div>
    </div>
  )
}

