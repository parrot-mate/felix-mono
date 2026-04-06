import { DoneOutline } from "@mui/icons-material"
import { Star } from "./Star"
import { keyframes } from "tss-react"
import { makeStyles } from "tss-react/mui"
import { FC } from "react"
import { Box } from "@mui/material"

interface FinishBadgeProps {
  active: boolean
  size: number
}

const myAnimation = keyframes`
    0%, 20%, 40%, 60%, 80%, 100%: {
      transitionTimingFunction: cubic-bezier(0.215, 0.610, 0.355, 1.000),
    }
    0% {
      transform: scale(.3)
    }
    20% {
      transform: scale(1.1)
    }
    40% {
      transform: scale(.9)
    }
    60% {
      transform: scale(1.03)
    }
    80% {
      transform: scale(0.97)
    }
    100% {
      transform: scale(1)
    }
`
const useStyles = makeStyles()((theme) => {
  return {
    root: {
      "& svg": {
        // stroke: theme.palette.felling.success,
        strokeWidth: 0,

        fill: theme.palette.felling.success,
      },
      // transition: "transform .2s cubic-bezier(0.4, 0.0, 0.2, 1)",
      transform: "scale(0)",
    },
    active: {
      animation: `${myAnimation} 1.0s forwards cubic-bezier(0.4, 0.0, 0.2, 1)`,
    },
  }
})
export const FinishBadge: FC<FinishBadgeProps> = ({ active, size }) => {
  const { classes, cx } = useStyles()
  const cl = cx(classes.root, active ? classes.active : "")

  return (
    <Box
      sx={{
        display: "inline-block",
        width: size + "px",
        height: size + "px",
        verticalAlign: "middle",
      }}
    >
      <Star
        className={cl}
        outerRadius={70}
        innerRadius={90}
        size={200}
        points={10}
        actualSize={size}
      >
        <DoneOutline
          sx={{
            stroke: "white",
            fill: "white !important",
            width: size / 4 + "px",
            height: size / 4 + "px",
          }}
        />
      </Star>
    </Box>
  )
}
