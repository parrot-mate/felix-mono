import { networkStateAtom } from "@/atom/offlineAtom"
import { companionModalAtom } from "@/atom/ui/companionModalAtom"
import { slideMenuAtom } from "@/atom/ui/slideMenuAtom"
import { CompanionSelectionPanel } from "@/component/companion/CompanionSelectionPanel"
import { useBook } from "@pmate/sdk"
import { Logger } from "@pmate/utils"
import { Book, DownloadingSharp, People } from "@mui/icons-material"
import MoreHorizIcon from "@mui/icons-material/MoreHoriz"
import { Box, IconButton } from "@mui/material"
import { useAtomValue, useSetAtom } from "jotai"
import { Suspense } from "react"
import { useNavigate } from "react-router"
import { makeStyles } from "tss-react/mui"
import { showDownloadTaskModal } from "./atoms/downloadTasksAtom"
import { tearModeHomeAtom } from "./atoms/tearModeHomeAtom"

const logger = Logger.getDebugger("BottomMenu")

const useStyles = makeStyles()(() => {
  return {
    back: {
      position: "fixed",
      top: "5px",
      left: "5px",
      zIndex: 2,
      "& svg": {
        fill: "white",
        opacity: 0.5,
        stroke: `rgba(0,0,0,.5)` /* Sets the outline color */,
        strokeWidth: 1 /* Adjusts the thickness of the outline */,
      },
    },
    more: {
      position: "fixed",
      top: "5px",
      right: "5px",
      zIndex: 2,
      "& svg": {
        fill: "white",
        opacity: 0.5,
      },
    },
  }
})
export const TopMenu = () => {
  const setOpen = useSetAtom(slideMenuAtom)
  const openHome = useSetAtom(tearModeHomeAtom)
  const nav = useNavigate()
  const id = useBook()
  const { classes } = useStyles()
  const openPanel = useSetAtom(companionModalAtom)
  const openDownload = useSetAtom(showDownloadTaskModal)
  const network = useAtomValue(networkStateAtom)

  return (
    <>
      <Box className={classes.back}>
        <IconButton
          onClick={() => {
            nav(`/book/${id}`, { replace: true })
          }}
        >
          <Book />
        </IconButton>
        {!network.offline && (
          <IconButton onClick={() => openPanel(true)}>
            <People />
          </IconButton>
        )}

        <IconButton
          onClick={() => {
            openDownload(true)
          }}
        >
          <DownloadingSharp />
        </IconButton>
      </Box>

      {/* <PlayerComponent onPlay={onPlay} /> */}

      <Box className={classes.more}>
        <IconButton
          onClick={() => {
            setOpen(true)
          }}
        >
          <MoreHorizIcon />
        </IconButton>
      </Box>
      <Suspense>
        <CompanionSelectionPanel />
      </Suspense>
    </>
  )
}
