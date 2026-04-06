import { IconButton } from "@pmate/uikit"
import { ReactNode, useEffect, useRef, useState } from "react"

interface ProfileSignatureProps {
  text: string
  onClick: () => void
  icon: ReactNode
  containerClassName?: string
  textClassName?: string
  gap?: number
}

export const ProfileSignature = ({
  text,
  onClick,
  icon,
  containerClassName = "h-8",
  textClassName = "text-base",
  gap = 4,
}: ProfileSignatureProps) => {
  const textRef = useRef<HTMLSpanElement>(null)
  const [textWidth, setTextWidth] = useState(0)

  useEffect(() => {
    const el = textRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setTextWidth(el.offsetWidth))
    ro.observe(el)
    setTextWidth(el.offsetWidth)
    return () => ro.disconnect()
  }, [text])

  return (
    <div className={`relative w-full flex items-center ${containerClassName}`}>
      <span
        ref={textRef}
        className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap ${textClassName}`}
      >
        {text}
      </span>
      <IconButton
        className="absolute top-1/2 -translate-y-1/2"
        styles={{ left: `calc(50% + ${textWidth / 2}px + ${gap}px)` }}
        onClick={onClick}
      >
        {icon}
      </IconButton>
    </div>
  )
}
