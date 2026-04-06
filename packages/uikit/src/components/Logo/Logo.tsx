import React from "react"
import type { BaseComponentProps } from "../../types/base"

const PM_STATIC = "https://parrot-static.pmate.chat"

export interface LogoProps extends BaseComponentProps {
  src?: string
}

export const Logo: React.FC<LogoProps> = ({
  src = `${PM_STATIC}/parrot-logo.png`,
  className,
  id,
  styles,
}) => {
  return (
    <div className={className} style={styles} id={id} data-uikit="logo">
      <img className="w-full h-full object-contain" src={src} alt="" />
    </div>
  )
}
