import clsx from "clsx"
import React from "react"
import type { BaseComponentProps } from "../../types/base"
import { IconLoading } from "../../icons/IconLoading"

export interface SpinnerProps extends BaseComponentProps {
  size?: number
  color?: string
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 24,
  color = "#999",
  className,
  id,
  styles,
}) => {
  return (
    <div
      id={id}
      data-uikit="spinner"
      style={styles}
      className={clsx("inline-flex items-center justify-center", className)}
    >
      <IconLoading style={{ width: size, height: size, fill: color }} />
    </div>
  )
}
