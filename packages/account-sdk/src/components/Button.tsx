import React from "react"

type ButtonVariant = "primary" | "plain"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const joinClassNames = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ")

const baseClassName =
  "inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors"

const variantClassName: Record<ButtonVariant, string> = {
  primary: "bg-slate-900 text-white hover:bg-slate-800",
  plain: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
}

export const Button = ({
  variant = "primary",
  className,
  disabled,
  ...props
}: ButtonProps) => {
  return (
    <button
      {...props}
      disabled={disabled}
      className={joinClassNames(
        baseClassName,
        variantClassName[variant],
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    />
  )
}
