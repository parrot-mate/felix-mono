import React, { ReactNode } from "react"
import { FlexCenter } from "../flex"

interface StarProps {
  points: number
  className: string
  size: number
  innerRadius: number
  outerRadius: number
  strokeColor?: string
  fillColor?: string
  actualSize: number
  children: ReactNode
}

export const Star: React.FC<StarProps> = ({
  points,
  size,
  innerRadius,
  outerRadius,
  actualSize,
  strokeColor,
  className,
  fillColor,
  children,
}) => {
  const createStarPoints = () => {
    const angle = (Math.PI * 2) / points
    let path = ""
    for (let i = 0; i < points; i++) {
      const xOuter = size / 2 + outerRadius * Math.cos(i * angle)
      const yOuter = size / 2 - outerRadius * Math.sin(i * angle)
      path += `${xOuter},${yOuter} `
      const xInner = size / 2 + innerRadius * Math.cos((i + 0.5) * angle)
      const yInner = size / 2 - innerRadius * Math.sin((i + 0.5) * angle)
      path += `${xInner},${yInner} `
    }
    return path
  }

  return (
    <FlexCenter
      sx={{
        position: "relative",
        width: actualSize + "px",
        height: actualSize + "px",
      }}
    >
      <FlexCenter
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
        className={className}
      >
        <svg viewBox={`0 0 ${size} ${size}`} width={"100%"} height={"100%"}>
          <polygon
            points={createStarPoints()}
            fill={fillColor}
            stroke={strokeColor}
          />
        </svg>
      </FlexCenter>
      <FlexCenter
        sx={{
          zIndex: 1,
          width: "100%",
          height: "100%",
        }}
      >
        {children}
      </FlexCenter>
    </FlexCenter>
  )
}
