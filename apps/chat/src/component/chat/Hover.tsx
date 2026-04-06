import React, {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"

interface HoverProps {
  anchorEl: HTMLElement | null
  children: ReactNode
  open: boolean
  isMe: boolean
  className?: string
  onClose: () => void
}

type Position = {
  top?: number
  left?: number
  right?: number
  bottom?: number
}

export const Hover: React.FC<HoverProps> = ({
  anchorEl,
  children,
  open,
  className = "",
  isMe,
  onClose,
}) => {
  const [position, setPosition] = useState<Position>({
    top: 0,
    left: 0,
    right: undefined,
  })
  const hoverRef = useRef<HTMLDivElement>(null)

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (
        hoverRef.current &&
        !hoverRef.current.contains(event.target as Node) &&
        anchorEl &&
        !anchorEl.contains(event.target as Node)
      ) {
        onClose()
      }
    },
    [onClose, anchorEl]
  )

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [handleClickOutside])

  useEffect(() => {
    if (anchorEl && hoverRef.current) {
      const rect = anchorEl.getBoundingClientRect()
      const position = isMe
        ? {
            top: rect.bottom + window.scrollY,
            right: 10,
          }
        : {
            top: rect.bottom + window.scrollY,
            left: rect.left,
          }
      console.log("[hover]", isMe, position)
      setPosition(position)
    }
  }, [anchorEl])

  if (!open) {
    return null
  }

  return (
    <div
      style={{ top: position.top, left: position.left, right: position.right }}
      className={`absolute z-10 rounded-lg border-1 border-gray-100 bg-gray-400 mt-1 ${className}`}
      ref={hoverRef}
    >
      {children}
    </div>
  )
}
