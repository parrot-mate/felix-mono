import { SxProps, Typography, useTheme } from "@mui/material"
import React, { FC } from "react"
import { TypoProps } from "./typo.types"
import { makeStyles } from "tss-react/mui"

interface SubProps extends TypoProps {
  level?: SubLevel
  oveflowHidden?: boolean
  reverse?: boolean
}

type SubLevel = 1 | 2

const useStyles = makeStyles()(() => ({
  overflowHidden: {
    textOverflow: "ellipsis",
    overflow: "hidden",
    whiteSpace: "nowrap",
  },
  reverse: {
    color: "white",
  },
}))

export const Sub: FC<SubProps> = ({
  children,
  level = 1,
  oveflowHidden = false,
  reverse,
}) => {
  const theme = useTheme()
  const map = {
    1: theme.palette.font.weak,
    2: theme.palette.font.veryweak,
  }

  const { classes } = useStyles()
  const cls = `${oveflowHidden ? classes.overflowHidden : ""} ${reverse ? classes.reverse : ""}`
  return (
    <Typography
      className={cls}
      variant="span"
      sx={{
        fontWeight: 400,
        fontSize: "0.9em",
        color: map[level],
      }}
    >
      {children}
    </Typography>
  )
}
