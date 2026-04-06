import { Logger } from "@pmate/utils"
import { Box } from "@mui/material"
import { makeStyles } from "tss-react/mui"

const useStyles = makeStyles()(() => ({
  root: {
    position: "fixed",
    top: "30%",
    left: 0,
    width: "100%",
    height: 0,
    opacity: 0.7,
    zIndex: 10,
    borderTop: "1px dashed rgba(0,0,0,0)",
  },
  show: {
    borderTop: "1px dashed #abc",
  },
}))
const logger = Logger.getDebugger("VisualLine")
export const VisualLine = ({ show }: { show: boolean }) => {
  const { classes, cx } = useStyles()
  logger.log({ show })
  const cl = cx(classes.root, show ? classes.show : "")

  return <Box className={cl}></Box>
}
