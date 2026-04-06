import { Box, BoxProps } from "@mui/material"
import { FC, Children } from "react"
import { makeStyles } from "tss-react/mui"

interface Props extends BoxProps {
  children: React.ReactNode
  direction: "row" | "column"
}
const useStyles = makeStyles()(() => ({
  root: {
    display: "flex",
    justifyContent: "space-between",
  },
}))
export const FlexLastSpread: FC<Props> = ({
  children,
  direction,
  sx,
  ...others
}) => {
  const list = Children.toArray(children)
  const last = list.pop()
  const { classes } = useStyles()

  return (
    <Box
      className={classes.root}
      sx={{
        flexDirection: direction,
        ...sx,
      }}
      {...others}
    >
      <Box
        flex={1}
        display={"flex"}
        alignItems={direction === "column" ? "flex-start" : "center"}
        flexDirection={direction}
      >
        {list}
      </Box>
      <Box>{last}</Box>
    </Box>
  )
}
