import React from "react"
import clsx from "clsx"
import type { BaseComponentProps } from "../../types/base"

export interface ModalProps extends BaseComponentProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  overlayClassName?: string
  keep?: boolean
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  children,
  className,
  overlayClassName,
  id,
  styles,
  keep = false,
}) => {
  if (!open && !keep) return null

  // 如果外部没给 overlayClassName，就用默认的半透明黑底
  const overlayCls = clsx(
    "fixed inset-0 z-[1002] flex items-center justify-center",
    overlayClassName ?? "bg-black/50",
    !open && keep && "pointer-events-none invisible opacity-0"
  )

  return (
    <div
      id={id}
      data-uikit="modal"
      className={overlayCls}
      aria-hidden={!open}
      onClick={onClose}
    >
      <div
        className={clsx("bg-white p-4", className)}
        style={styles}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
