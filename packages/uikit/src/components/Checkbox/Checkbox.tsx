import React from "react"
import clsx from "clsx"
import type { BaseComponentProps } from "../../types/base"

export interface CheckboxProps extends BaseComponentProps {
  checked?: boolean
  defaultChecked?: boolean
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  name?: string
  value?: string
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    { checked, defaultChecked, onChange, className, id, styles, name, value },
    ref
  ) => {
    return (
      <input
        ref={ref}
        type="checkbox"
        id={id}
        data-uikit="checkbox"
        name={name}
        value={value}
        style={styles}
        className={clsx("form-checkbox w-4 h-4", className)}
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={onChange}
      />
    )
  }
)
