import React from "react"

export interface LoadingSphereProps {
  /** Diameter in pixels */
  size?: number
  /** Base duration in seconds for pulsing and spinning */
  duration?: number
  /** Additional Tailwind classes */
  className?: string
}

/**
 * LoadingSphere
 * A pulsating, spinning gradient sphere (à la Siri) using Tailwind CSS.
 *
 * Note: Ensure you have the following keyframes in your global CSS (e.g., globals.css) or Tailwind config:
 *

 */
export const LoadingSphere: React.FC<LoadingSphereProps> = ({
  size = 40,
  duration = 0.5,
  className = "",
}) => {
  const style: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    background:
      "conic-gradient(#ff3b30, #ff9500, #ffcc00, #4cd963, #007aff, #5856d6, #ff3b30)",
    backgroundSize: "200% 200%",
    animation: `pulse ${duration}s ease-in-out infinite, spin ${
      duration * 2
    }s linear infinite`,
  }

  return <div className={`${className} rounded-full`} style={style} />
}
