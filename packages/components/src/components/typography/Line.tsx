import { makeStyles } from "tss-react/mui"
import { FlexRow } from "../flex"

const useStyles = makeStyles()(() => ({
  root: {
    padding: 0,
    margin: 0,
  },
}))

export const Line = ({
  children,
  spacing = 1,
  align = "left",
}: {
  children: React.ReactNode
  spacing?: number
  align?: "center" | "left"
}) => {
  const { classes } = useStyles()
  return (
    <FlexRow
      justifyContent={align === "left" ? "flex-start" : "center"}
      alignItems={"center"}
      style={{
        margin: `${spacing * 10}px 0`,
      }}
      className={classes.root}
    >
      {children}
    </FlexRow>
  )
}
