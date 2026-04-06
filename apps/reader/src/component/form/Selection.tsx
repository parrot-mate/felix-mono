import { MenuItem, Select, SelectProps } from "@mui/material"

type SelectionProps = SelectProps & {
  options: {
    label: string
    value: any
  }[]
  onChange: (val: any) => void
}
export const Selection: React.FC<SelectionProps> = ({
  options,
  placeholder,
  onChange,
  ...props
}) => {
  return (
    <Select
      {...props}
      displayEmpty
      defaultValue={props.defaultValue || "__empty__"}
      onChange={(evt) => {
        const val = evt.target.value
        if (val === "__empty__") {
          onChange?.(undefined)
          return
        }
        onChange?.(evt.target.value)
      }}
    >
      <MenuItem disabled value="__empty__">
        <em>{placeholder}</em>
      </MenuItem>
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </Select>
  )
}
