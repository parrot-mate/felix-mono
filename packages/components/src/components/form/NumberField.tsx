import { TextField, TextFieldProps } from "@mui/material"
import { forwardRef } from "react"

interface NumberFieldProps {
  maxLength?: number
}

const allowedKeys = [
  "Backspace",
  "ArrowLeft",
  "ArrowRight",
  "Delete",
  "Tab",
  "Enter",
  "Home",
  "End",
]

export const NumberField = forwardRef<
  HTMLDivElement,
  NumberFieldProps & TextFieldProps
>((props: NumberFieldProps & TextFieldProps, ref) => {
  const { maxLength, onChange, ...rest } = props

  return (
    <TextField
      {...rest}
      ref={ref}
      inputProps={{ maxLength }}
      onChange={(e) => {
        onChange && onChange(e)
      }}
      onKeyDown={(e) => {
        const inputElement = e.target as HTMLInputElement

        // Allow navigation keys and operations
        if (allowedKeys.includes(e.key)) {
          return
        }

        // Prevent non-numeric input
        if (!e.key.match(/^[0-9]$/)) {
          e.preventDefault()
        }

        // Check if the input length exceeds maxLength
        if (maxLength !== undefined && inputElement.value.length >= maxLength) {
          e.preventDefault()
        }
      }}
    />
  )
})
