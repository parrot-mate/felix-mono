import { memo, useState } from "react"
import { Menu } from "./Menu"
import classes from "./ReaderFootBar.module.scss"
import {
  Reorder,
  StyleOutlined,
  TextDecrease,
  TextIncrease,
} from "@mui/icons-material"
import {
  Box,
  Drawer,
  FormControlLabel,
  IconButton,
  Switch,
} from "@mui/material"
import { useShowWhenScrollUp } from "@/hook/useShow"
import { CirclePicker } from "react-color"
import { useAtom, useAtomValue } from "jotai"
import { userSettingsAtom } from "@pmate/account-sdk"
import { setFontSizeAtom } from "@pmate/sdk"
import { bookAtom } from "@pmate/sdk"
import { useBook } from "@pmate/sdk"
import { Logger } from "@pmate/utils"
import { footbarAtom } from "@/atom/ui/footbarAtom"

const logger = Logger.getDebugger("ReaderFootBar")
export const ReaderFootBar = memo(() => {
  const [show, setShow] = useAtom(footbarAtom)
  const showTitleBar = useShowWhenScrollUp()
  const [openStyle, setOpenStyle] = useState(false)
  const [backgroundColor, setBgColor] = useAtom<string>(
    userSettingsAtom("backgroundColor") as any
  )
  const [intensive, setIntensive] = useAtom<boolean>(
    userSettingsAtom("intensive") as any
  )
  const [bilingual, setBilingual] = useAtom<boolean>(
    userSettingsAtom("bilingual") as any
  )
  const [, setFontSize] = useAtom(setFontSizeAtom)
  logger.log("showTitlebar", showTitleBar)

  return (
    <div>
      <Menu show={show} setShow={setShow} />
      <div
        className={classes.ReaderFootBar}
        style={{
          transform: showTitleBar ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.2s",
          backgroundColor: backgroundColor,
          willChange: "transform",
        }}
      >
        <div className={classes.TabPanel}>
          <div>
            <IconButton
              onClick={() => {
                setShow(true)
              }}
            >
              <Reorder />
            </IconButton>
          </div>

          <div>
            <IconButton
              onClick={() => {
                setFontSize((x) => {
                  if (x < 30) {
                    return x + 1
                  }
                  return x
                })
              }}
            >
              <TextIncrease />
            </IconButton>
          </div>

          <div>
            <IconButton
              onClick={() => {
                setFontSize((x) => {
                  if (x > 10) {
                    return x - 1
                  }
                  return x
                })
              }}
            >
              <TextDecrease />
            </IconButton>
          </div>
          <div>
            <FormControlLabel
              control={
                <Switch
                  checked={intensive}
                  onChange={() => {
                    setIntensive(!intensive)
                  }}
                />
              }
              label="精"
            />
          </div>
          <div>
            <FormControlLabel
              control={
                <Switch
                  checked={bilingual}
                  onChange={() => {
                    setBilingual(!bilingual)
                  }}
                />
              }
              label="双"
            />
          </div>
        </div>
        <div>
          <IconButton
            onClick={() => {
              setOpenStyle(true)
            }}
          >
            <StyleOutlined />
          </IconButton>
        </div>
      </div>

      <Drawer
        id="bg-drawer"
        anchor="bottom"
        open={openStyle}
        onClick={() => {
          setOpenStyle(!openStyle)
        }}
      >
        <Box display={"flex"} alignItems={"center"} flexDirection={"column"}>
          <h3>背景色</h3>
          <CirclePicker
            color={"transparent"}
            onChange={(value) => {
              setBgColor(value.hex)
            }}
            colors={[
              "transparent",
              "#FFFFFF", // White
              "#F5F5F5", // Light Gray
              "#ffc0cb", // Pink
              "#D3D3D3", // Light Gray
              "#C0C0C0", // Silver
              "#B0C4DE", // Light Steel Blue
              "#FAFAD2", // Light Goldenrod Yellow
              "#F0FFF0", // Honeydew
              "#F0F8FF", // Alice Blue
              "#E6E6FA", // Lavender
              "#FFFACD", // Lemon Chiffon
              "#F5FFFA", // Mint Cream
            ]}
          />
        </Box>
      </Drawer>
    </div>
  )
})

export default ReaderFootBar
