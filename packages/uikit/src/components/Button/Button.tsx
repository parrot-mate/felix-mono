import clsx from "clsx"
import { motion } from "framer-motion"
import React from "react"
import { useUikitTheme } from "../../store/theme"
import type { ButtonVariant } from "../../theme/buttonTheme"
import { buttonThemeClassMap } from "../../theme/buttonTheme"
import type { BaseComponentProps } from "../../types/base"

export interface ButtonProps extends BaseComponentProps {
  children: React.ReactNode
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  variant?: ButtonVariant
  type?: "button" | "submit" | "reset"
  /** Element to render before the button label */
  startIcon?: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  variant = "primary",
  type = "submit",
  className,
  styles,
  id,
  startIcon,
}) => {
  const theme = useUikitTheme()
  const variantClass = buttonThemeClassMap[theme][variant || "primary"]

  return (
    <motion.button
      id={id}
      data-uikit="button"
      style={styles}
      type={type}
      className={clsx(
        "text-base rounded-xl py-1 px-3",
        variantClass,
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.05 } : undefined}
      whileTap={!disabled ? { scale: 0.95 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
    >
      {startIcon && <span className="mr-1 inline-flex">{startIcon}</span>}
      {children}
    </motion.button>
  )
}
