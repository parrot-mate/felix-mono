import React, { FC, useRef, useEffect, CSSProperties } from "react"

interface HallowRectProps {
  width: number // Width of the outer rectangle
  height: number // Height of the outer rectangle
  innerWidth: number // Width of the hollow rectangle inside the outer rectangle
  innerHeight: number // Height of the hollow rectangle inside the outer rectangle
  className?: string
  style?: CSSProperties
}

export const HallowRect: FC<HallowRectProps> = ({
  width,
  height,
  innerWidth,
  innerHeight,
  style,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext("2d")
      if (ctx) {
        // Clear the canvas
        ctx.clearRect(0, 0, width, height)

        // Draw the semi-transparent outer rectangle
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)" // Semi-transparent black
        ctx.fillRect(0, 0, width, height)

        // Calculate the top-left position of the inner hollow rectangle to center it
        const top = (height - innerHeight) / 2
        const left = (width - innerWidth) / 2

        // Clear the inner rectangle to make it hollow
        ctx.clearRect(left, top, innerWidth, innerHeight)

        // Optionally draw a border around the hollow rectangle
        ctx.strokeStyle = "white"
        ctx.strokeRect(left, top, innerWidth, innerHeight)
      }
    }
  }, [width, height, innerWidth, innerHeight])

  return (
    <canvas
      className={className}
      style={style}
      ref={canvasRef}
      width={width}
      height={height}
    />
  )
}
