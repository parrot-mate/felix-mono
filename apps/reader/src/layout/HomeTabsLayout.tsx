import { homeTabAtom } from "@/atom/ui/homeTabAtom"
import { GlobalLoading } from "@/component/GlobalLoading"
import { BookReaderTitleBar } from "@/reader/BookReaderTitleBar"
import {
  Checklist,
  Home as HomeIcon,
  Search,
  Upload,
} from "@mui/icons-material"
import MenuIcon from "@mui/icons-material/Menu"
import { Tab, Tabs } from "@mui/material"
import { Logger } from "@pmate/utils"
import { profileAtom } from "@pmate/account-sdk"
import { IconButton } from "@pmate/uikit"
import { usePrevious } from "@uidotdev/usehooks"
import { useAtom, useAtomValue } from "jotai"
import { ReactNode, Suspense, useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { makeStyles } from "tss-react/mui"

const logger = Logger.getDebugger("Home")
// let once = false
export const HomeTabsLayout = ({ children }: { children: ReactNode }) => {
  const profile = useAtomValue(profileAtom)
  const userId = profile?.id ?? ""

  const [open, setOpen] = useState(false)
  const nav = useNavigate()

  useEffect(() => {
    if (!userId) {
      nav("/")
    }
  }, [userId])
  return (
    <Suspense fallback={<GlobalLoading />}>
      <BookReaderTitleBar
        left={
          <IconButton
            onClick={() => {
              nav("/browser")
            }}
          >
            <Search className="fill-white" />
          </IconButton>
        }
        title="薯片阅读"
        right={
          <IconButton
            onClick={() => {
              setOpen(true)
            }}
          >
            <MenuIcon className="text-white" />
          </IconButton>
        }
      />
      {children}
      <BottomBar />
    </Suspense>
  )
}

const useStyles = makeStyles()((theme) => ({
  root: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50px",
    backgroundColor: "white",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderTop: "1px solid #e0e0e0",
    zIndex: 2,
    "& svg": {
      fill: theme.palette.felling.info,
    },
  },
  active: {
    "& svg": {
      fill: `${theme.palette.felling.successActive} !important`,
    },
  },
}))
const BottomBar = () => {
  const { classes } = useStyles()
  const [tab, setTab] = useAtom(homeTabAtom)
  const nav = useNavigate()
  const prevTab = usePrevious(tab)

  useEffect(() => {
    if (prevTab !== tab) {
      nav(tab)
    }
  }, [tab, prevTab])
  return (
    <div className={classes.root}>
      <Tabs
        onChange={(_, value) => {
          logger.log("nav", value)
          // nav(value, { replace: true })
          setTab(value)
        }}
        value={tab}
      >
        <Tab
          value={"/"}
          icon={<HomeIcon />}
          label="首页"
          iconPosition={"start"}
          className={tab === "/" ? classes.active : ""}
        />
        <Tab
          value={"/upload"}
          icon={<Upload />}
          label="上传"
          iconPosition="start"
          className={tab === "/upload" ? classes.active : ""}
        />
        <Tab
          value={"/vocabulary"}
          icon={<Checklist />}
          label="生词本"
          iconPosition="start"
          className={tab === "/vocabulary" ? classes.active : ""}
        />
      </Tabs>
    </div>
  )
}
