import { CurrencyBitcoin } from "@mui/icons-material"
import { FlexRow } from "../flex"
import { makeStyles } from "tss-react/mui"

import CountUp from "react-countup"
const useStyles = makeStyles()((theme) => {
  return {
    root: {
      "& span": {
        color: theme.palette.felling.money,
      },
      "& svg": {
        fill: theme.palette.felling.money,
      },
    },
    small: {
      "& span": {
        fontSize: "1rem",
      },
      "& svg": {
        width: "1rem",
      },
    },
    medium: {
      "& span": {
        fontSize: "1.5rem",
      },
      "& svg": {
        width: "1.5rem",
      },
    },
    large: {
      "& span": {
        fontSize: "2.0rem",
      },
      "& svg": {
        width: "2.0rem",
      },
    },
  }
})
export const Coin = ({
  num,
  size,
  play = false,
}: {
  num: number
  size: "small" | "medium" | "large"
  play?: boolean
}) => {
  const { classes } = useStyles()
  const cls = `${classes.root} ${classes[size]}`
  return (
    <FlexRow alignItems={"center"} className={cls}>
      {play && <CountUp start={0} end={num} duration={2.75}></CountUp>}
      {!play && <span>{num}</span>}
      <CurrencyBitcoin />
    </FlexRow>
  )
}
