import { ReactNode } from "react"
import { makeStyles } from "tss-react/mui"
import { FlexCenter } from "../flex"

const useStyles = makeStyles()(() => {
  return {
    root: {
      cursor: "pointer",
      display: "inline-block",
      verticalAlign: "middle",
      paddinng: "2px",
    },
    inner: {
      transition: "all 0.2s ease",
      "&:hover": {
        opacity: 0.8,
      },
      "&:active": {
        borderRadius: "50%",
        backgroundColor: "rgba(0, 0, 0, 0.1)",
      },
    },
  }
})
export const IconButton = ({
  onClick,
  children,
}: {
  onClick: () => void
  children: ReactNode
}) => {
  const { classes } = useStyles()
  return (
    <div
      className={classes.root}
      onClick={() => {
        onClick()
      }}
    >
      <FlexCenter className={classes.inner}>{children}</FlexCenter>
    </div>
  )
}
