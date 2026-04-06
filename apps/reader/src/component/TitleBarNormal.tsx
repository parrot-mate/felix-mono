import { useTitlebar } from "@/hook/useTitlebar"
import SearchIcon from "@mui/icons-material/Search"
import { useTranslation } from "@pmate/i18n"
import { IconButton } from "@pmate/uikit"
import { useNavigate } from "react-router"
import { TitleBarContainer } from "./TitleBarContainer"

import { userAccountModalAtom } from "@/atom/modalAtoms"
import { profileAtom } from "@pmate/account-sdk"
import { useAtom, useAtomValue } from "jotai"
import { useState } from "react"
import { makeStyles } from "tss-react/mui"

export const TitleBarNormal = () => {
  const { scrollOut } = useTitlebar()
  const nav = useNavigate()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const [, showLogin] = useAtom(userAccountModalAtom)
  const open = Boolean(anchorEl)

  const profile = useAtomValue(profileAtom)
  const userId = profile?.id ?? ""
  const { classes } = useStyles()
  const t = useTranslation()
  return (
    <TitleBarContainer alwaysVisible={true}>
      <IconButton
        onClick={async () => {
          if (!userId) {
            showLogin((x) => {
              return {
                ...x,
                open: true,
              }
            })
            return
          }

          nav("/browser")
        }}
      >
        <SearchIcon />
      </IconButton>

      <div
        className={classes.title}
        style={{
          flex: 1,
          // color: scrollOut ? "rgb(102, 102, 102)" : "rgba(0,0,0,0)",
        }}
      >
        {t("PChip Reader")}
      </div>

      <div></div>
    </TitleBarContainer>
  )
}

const useStyles = makeStyles()(() => {
  return {
    title: {
      textAlign: "center",
      fontFamily: '"Microsoft YaHei", "Helvetica"',
      fontWeight: 600,
    },
  }
})
