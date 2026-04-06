import { formatTime } from "@pmate/utils"
import { makeStyles } from "tss-react/mui"
import { StyleProps } from "../component.types"
import { FlexRow } from "./flex"

interface MetricDisplayProps extends StyleProps {
  label: string
  value: number
  unit?: string
  labelWidth?: string
  reverse?: boolean
  valueWidth?: string
}

const useStyles = makeStyles()((theme) => ({
  labelText: {
    color: theme.palette.font.weak,
  },
  reverse: {
    color: theme.palette.font.reverseWeak,
  },
}))

export const MetricDisplay = (props: MetricDisplayProps) => {
  const { label, value, unit, sx, className } = props
  const { classes } = useStyles()
  let displayValue = value
  let displayUnit = unit || ""
  switch (unit) {
    case "time": {
      ;[displayValue, displayUnit] = formatTime(value)
      break
    }
  }
  const cls = `${props.reverse ? classes.reverse : classes.labelText}`
  return (
    <FlexRow
      justifyContent={"flex-start"}
      alignItems={"center"}
      sx={{
        lineHeight: "30px",
        whiteSpace: "nowrap",
        marginRight: "30px",
        width: "140px",
        ...sx,
      }}
      className={className}
    >
      <label
        className={cls}
        style={{
          flex: 5,
          fontWeight: 700,
          display: "inline-block",
          width: props.labelWidth || "auto",
          marginRight: "5px",
        }}
      >
        {label}:
      </label>
      <span
        className={cls}
        style={{
          flex: 3,
          width: props.valueWidth || "auto",
          display: "inline-block",
          textAlign: "right",
        }}
      >
        {displayValue}
      </span>
      <span
        style={{
          display: "inline-block",
          flex: 1,
          color: "#666",
          marginLeft: 4,
          fontSize: "11px",
        }}
      >
        {displayUnit}
      </span>
    </FlexRow>
  )
}
