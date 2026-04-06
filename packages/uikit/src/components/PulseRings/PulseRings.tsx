import clsx from "clsx"
import { memo } from "react"

type PulseRingConfig = {
  sizeRem: number
  durationMs: number
  delayMs?: number
  opacity?: number
  shadowBlurPx?: number
}

export interface PulseRingsProps {
  color?: string
  rings?: PulseRingConfig[]
  ringClassName?: string
}

const baseRingClasses =
  "pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full animate-ping"

const defaultRings: PulseRingConfig[] = [
  { sizeRem: 3.2, durationMs: 1300, opacity: 0.3, shadowBlurPx: 6 },
  {
    sizeRem: 3.6,
    durationMs: 1600,
    delayMs: 200,
    opacity: 0.25,
    shadowBlurPx: 8,
  },
  {
    sizeRem: 3.8,
    durationMs: 1900,
    delayMs: 400,
    opacity: 0.2,
    shadowBlurPx: 10,
  },
]

const toRgba = (color: string, opacity = 1) => {
  const hex = color.startsWith("#") ? color.slice(1) : null
  if (!hex) {
    return color
  }

  const normalized =
    hex.length === 3
      ? hex
          .split("")
          .map((char) => char + char)
          .join("")
      : hex

  if (normalized.length !== 6) {
    return color
  }

  const [r, g, b] = [
    normalized.slice(0, 2),
    normalized.slice(2, 4),
    normalized.slice(4, 6),
  ].map((value) => parseInt(value, 16))

  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

export const PulseRings = memo(
  ({ color = "#9C6BFF", rings = defaultRings, ringClassName }: PulseRingsProps) => {
    return (
      <>
        {rings.map((ring, index) => (
          <span
            aria-hidden
            key={index}
            className={clsx(baseRingClasses, ringClassName)}
            style={{
              width: `${ring.sizeRem}rem`,
              height: `${ring.sizeRem}rem`,
              animationDuration: `${ring.durationMs}ms`,
              animationDelay:
                ring.delayMs !== undefined ? `${ring.delayMs}ms` : undefined,
              backgroundColor: toRgba(color, ring.opacity),
              filter: `drop-shadow(0 0 ${ring.shadowBlurPx ?? 6}px ${color})`,
            }}
          />
        ))}
      </>
    )
  }
)

PulseRings.displayName = "PulseRings"
