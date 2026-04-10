import React from "react"

export type BlueprintButtonProps = {
  children: React.ReactNode
  variant?: "primary" | "secondary" | "ghost"
  disabled?: boolean
  ariaLabel?: string
  onClick?: () => void
}

export function BlueprintButton({
  children,
  variant = "primary",
  disabled,
  ariaLabel,
  onClick,
}: BlueprintButtonProps) {
  return (
    <button
      type="button"
      className={`bp-button bp-button--${variant}`}
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
