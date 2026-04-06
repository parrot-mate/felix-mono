import { Typography } from "@mui/material"
import React, { FC, useEffect } from "react"
import { TypoProps } from "./typo.types"
import { makeStyles } from "tss-react/mui"

interface EmphasizeProps extends TypoProps {
  level?: EmphasizeLevel
  reverse?: boolean
}

type EmphasizeLevel = 1 | 2 | 3 | 4
const map = {
  1: 1.0,
  2: 1.1,
  3: 1.2,
  4: 1.3,
}

const useStyles = makeStyles()(() => ({
  reverse: {
    color: "white",
  },
}))

export const Em: FC<EmphasizeProps> = ({ children, level = 1, reverse }) => {
  const { classes } = useStyles()
  const cls = `${reverse ? classes.reverse : ""}`
  return (
    <Typography
      variant="span"
      className={cls}
      sx={{
        fontWeight: 700,
        fontSize: `${map[level]}em`,
      }}
    >
      {children}
    </Typography>
  )
}
