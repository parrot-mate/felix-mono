import { CheckCircle } from "@mui/icons-material"
import { FC } from "react"
import { IconBox } from "./IconBox"

interface PunchProgressItem {
  index: number
  chapters: string[]
  percent: number
  wc: number
  active: boolean
  onClick?: () => void
}

function mapColor(percent: number, active: boolean): string {
  const clamp = (value: number, min: number, max: number): number =>
    Math.min(Math.max(value, min), max)

  function blendColors(
    color1: { r: number; g: number; b: number },
    color2: { r: number; g: number; b: number },
    weight: number
  ): string {
    const w = clamp(weight, 0, 1)
    const w1 = 1 - w

    const r = Math.round(color1.r * w1 + color2.r * w)
    const g = Math.round(color1.g * w1 + color2.g * w)
    const b = Math.round(color1.b * w1 + color2.b * w)

    return `rgb(${r}, ${g}, ${b})`
  }

  function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const bigint = parseInt(hex.replace("#", ""), 16)
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255,
    }
  }

  const baseGreen = hexToRgb("#4CAF50") // Default green
  const blue = hexToRgb("#87c7e8") // Default blue

  // Reduce green intensity by percent
  const adjustedGreen = {
    r: baseGreen.r + Math.round((255 - baseGreen.r) * (1 - percent / 100)),
    g: baseGreen.g + Math.round((255 - baseGreen.g) * (1 - percent / 100)),
    b: baseGreen.b + Math.round((255 - baseGreen.b) * (1 - percent / 100)),
  }

  if (active) {
    return blendColors(adjustedGreen, blue, 0.5) // Blend green with blue
  }

  // Return adjusted green for non-active
  return `rgb(${adjustedGreen.r}, ${adjustedGreen.g}, ${adjustedGreen.b})`
}

export const PunchProgressItem: FC<PunchProgressItem> = ({
  index,
  percent,
  active,
  onClick,
}) => {
  return (
    <div
      className="flex w-full box-border border-1 border-gray-700 px-1 py-1  justify-center items-center"
      style={{ backgroundColor: mapColor(percent, active) }}
      onClick={() => {
        onClick && onClick()
      }}
      data-percent={percent}
    >
      <span className={`font-bold mr-1 ${percent > 50 ? "text-white" : ""}`}>
        挑战{index + 1}
      </span>
      <IconBox
        use="pretext"
        size="small"
        type={percent > 50 ? "reverse" : "unfinished"}
      >
        <CheckCircle />
      </IconBox>
    </div>
  )
}
