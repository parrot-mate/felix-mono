import { memo, useEffect } from "react"
import { Drawer } from "@mui/material"
import { TableOfContents } from "./TableOfContents"
import { makeStyles } from "tss-react/mui"

const useStyles = makeStyles()(() => ({
  root: {
    "& .MuiDrawer-paper": {
      width: "75%",
      borderRadius: 0,
      padding: "0",
      maxWidth: "300px",
    },
  },
}))

export const Menu = memo(
  ({ show, setShow }: { show: boolean; setShow: (show: boolean) => void }) => {
    const { classes } = useStyles()

    return (
      <>
        <Drawer
          id="menu-drawer"
          className={classes.root}
          open={show}
          keepMounted={true}
          anchor="left"
          onClose={() => {
            setShow(false)
          }}
        >
          <TableOfContents
            onChange={() => {
              setShow(false)
            }}
          />
        </Drawer>
      </>
    )
  }
)
