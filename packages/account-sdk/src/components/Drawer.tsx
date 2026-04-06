import React, { useEffect, useState } from "react"

type DrawerAnchor = "left" | "right" | "top" | "bottom"

export interface DrawerProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  anchor?: DrawerAnchor
  className?: string
  overlayClassName?: string
  id?: string
  style?: React.CSSProperties
}

const joinClassNames = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ")

const positionClassMap: Record<DrawerAnchor, string> = {
  left: "left-0 top-0 h-full",
  right: "right-0 top-0 h-full",
  top: "left-0 top-0 w-full",
  bottom: "bottom-0 left-0 w-full",
}

const hiddenTransformMap: Record<DrawerAnchor, string> = {
  left: "-translate-x-full",
  right: "translate-x-full",
  top: "-translate-y-full",
  bottom: "translate-y-full",
}

export const Drawer = ({
  open,
  onClose,
  children,
  anchor = "right",
  className,
  overlayClassName,
  id,
  style,
}: DrawerProps) => {
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

  return (
    <div
      id={id}
      className={joinClassNames("fixed inset-0 z-[1002]", overlayClassName)}
      onClick={onClose}
    >
      <div
        className={joinClassNames(
          "absolute bg-white transition-transform duration-300",
          positionClassMap[anchor],
          open ? "translate-x-0 translate-y-0" : hiddenTransformMap[anchor],
          className,
        )}
        style={style}
        onClick={(event) => event.stopPropagation()}
        onTransitionEnd={handleTransitionEnd}
      >
        {children}
      </div>
    </div>
  )
}
