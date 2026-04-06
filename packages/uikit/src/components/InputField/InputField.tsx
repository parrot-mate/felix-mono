import clsx from "clsx"
import React from "react"
import { useUikitTheme } from "../../store/theme"
import type { InputVariant } from "../../theme/inputTheme"
import { inputThemeClassMap } from "../../theme/inputTheme"
import type { BaseComponentProps } from "../../types/base"

export interface InputFieldProps extends BaseComponentProps {
  type?: "text" | "email" | "password" | "number" | "tel"
  value?: string
  defaultValue?: string
  color?: string
  variant?: InputVariant
  placeholder?: string
  disabled?: boolean
  multiline?: boolean
  onChange?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void
  onFocus?: (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void
  onBlur?: (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void
  // ✅ 新增的支持 RHF 的属性（可选）
  name?: string
  ref?: React.Ref<HTMLInputElement | HTMLTextAreaElement>
}

// React.forwardRef 支持 RHF 自动绑定 ref
export const InputField = React.forwardRef<
  HTMLTextAreaElement | HTMLInputElement,
  InputFieldProps &
    React.InputHTMLAttributes<HTMLInputElement> &
    React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(
  (
    {
      type = "text",
      multiline = false,
      value,
      defaultValue,
      variant = "primary",
      placeholder,
      disabled = false,
      onChange,
      onFocus,
      onBlur,
      className,
      id,
      style,
      ...restProps // ⬅️ 包含 RHF 的 register 绑定（如 name, onChange, onBlur, ref）
    },
    ref
  ) => {
    const theme = useUikitTheme()
    const variantClass = inputThemeClassMap[theme][variant]
    const commonProps = {
      ref,
      value,
      defaultValue,
      placeholder,
      disabled,
      onChange,
      onFocus,
      onBlur,
      id,
      "data-uikit": "input_field",
      style,
      className: clsx(
        "rounded-xl px-4 py-2 border border-transparent focus:outline-none transition-colors duration-200",
        variantClass,
        className
      ),
      ...restProps,
    }

    if (multiline) {
      return <textarea {...(commonProps as any)} />
    }

    return <input type={type} {...(commonProps as any)} />
  }
)
