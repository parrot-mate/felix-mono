import { slideMenuAtom } from "@/atom/ui/slideMenuAtom"
import { userSettingsAtom } from "@pmate/account-sdk"
import {
  setFontSizeAtom,
  userFontSizeAtom,
} from "@pmate/sdk"
import { refreshPWA } from "@/util/refreshPWA"
import { FlexRow } from "@pchip/components"
import { PCHIPVER } from "@pmate/meta"

import { Close } from "@mui/icons-material"
import {
  Box,
  Button,
  Drawer,
  IconButton,
  MenuItem,
  Select,
  SelectChangeEvent,
  Slider,
  Switch,
  SxProps,
} from "@mui/material"
import { Difficulty } from "@pmate/meta"
import { Logger } from "@pmate/utils"
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai"
import { debounce } from "lodash"
import { makeStyles } from "tss-react/mui"

const useStyles = makeStyles()(() => {
  return {
    root: {
      "& .MuiPaper-root": {
        borderRadius: 0,
        height: "80%",
        // width: "60%",
      },
    },
  }
})

const logger = Logger.getDebugger("slideMenu")
const setCharacterAtom = atom(null, async (_, set, name: string) => {
  await set(userSettingsAtom("companion"), name)
})
export const SlideMenu = () => {
  const [autoload, setAutoRead] = useAtom(userSettingsAtom("autoread"))
  logger.log(autoload)
  const { classes } = useStyles()
  const fontSize = useAtomValue(userFontSizeAtom)
  const [playSpeed, setPlaySpeed] = useAtom(userSettingsAtom("playSpeed"))
  const open = useAtomValue(slideMenuAtom)
  const setMenu = useSetAtom(slideMenuAtom)
  const setFontSize = useSetAtom(setFontSizeAtom)
  const [dir, setDir] = useAtom(userSettingsAtom("scrollDirection"))
  const [difficulty, setDifficulty] = useAtom(userSettingsAtom("difficulty"))

  return (
    <Drawer
      id="slide-menu-drawer"
      open={open}
      className={classes.root}
      anchor="bottom"
    >
      <Box
        sx={{
          padding: "40px 20px",
        }}
      >
        <IconButton
          onClick={() => {
            setMenu(false)
          }}
          sx={{
            position: "absolute",
            right: 10,
            top: 10,
          }}
        >
          <Close />
        </IconButton>

        <ConfigItem label="自动朗读">
          <Switch
            onChange={() => {
              setAutoRead(!autoload)
            }}
            defaultChecked={autoload}
            value={autoload}
          />
        </ConfigItem>

        <ConfigItem
          label="文字大小"
          sx={{
            marginTop: "10px",
          }}
        >
          <Slider
            min={14}
            step={2}
            max={30}
            marks={[
              { value: 14, label: "小" },
              { value: 30, label: "大" },
            ]}
            valueLabelDisplay="on"
            onChange={debounce((_, value) => {
              setFontSize(value as number)
            }, 600)}
            defaultValue={fontSize}
            sx={{
              width: "80%",
            }}
          />
        </ConfigItem>

        <ConfigItem
          label="播放速度"
          sx={{
            marginTop: "10px",
          }}
        >
          <Slider
            min={0.5}
            step={0.1}
            max={2.0}
            defaultValue={playSpeed}
            valueLabelDisplay="on"
            onChange={debounce((_, value) => {
              setPlaySpeed(value as number)
            }, 600)}
            sx={{
              width: "80%",
            }}
          />
        </ConfigItem>

        <ConfigItem label="难度">
          <Select
            onChange={async (e: SelectChangeEvent) => {
              const val = parseInt(e.target.value) as Difficulty
              await setDifficulty(val)
              window.location.reload()
            }}
            defaultValue={difficulty + ""}
          >
            <MenuItem value={Difficulty.Newbie}>新手</MenuItem>
            <MenuItem value={Difficulty.Medium}>进阶</MenuItem>
            <MenuItem value={Difficulty.Advanced}>高级</MenuItem>
            <MenuItem value={Difficulty.Professional}>专业</MenuItem>
          </Select>
        </ConfigItem>

        <ConfigItem label="纵向翻页">
          <Switch
            checked={dir === "vertical"}
            onChange={() => {
              setDir(dir === "vertical" ? "horizontal" : "vertical")
            }}
          />
        </ConfigItem>
      </Box>

      <div
        style={{
          padding: "20px",
          fontWeight: "600",
          fontStyle: "italic",
        }}
      >
        ver: {PCHIPVER}
        <Button
          onClick={() => {
            refreshPWA()
          }}
        >
          更新
        </Button>
      </div>
    </Drawer>
  )
}

const ConfigItem = ({
  label,
  children,
  sx,
}: {
  label: string
  children: React.ReactNode
  sx?: SxProps
}) => {
  return (
    <FlexRow
      justifyContent={"flex-start"}
      alignItems={"center"}
      sx={{
        height: "60px",
        ...sx,
      }}
    >
      <label
        style={{
          flexShrink: 0,
          display: "inline-block",
          fontSize: "20px",
          fontWeight: "bold",
          color: "#666",
          width: "120px",
        }}
      >
        {label}
      </label>
      <Box flex={1}>{children}</Box>
    </FlexRow>
  )
}
