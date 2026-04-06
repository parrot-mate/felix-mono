import { AccountModalPhase, userAccountModalAtom } from "@/atom/modalAtoms"
import { userSettingsAtom } from "@pmate/account-sdk"
import { AvatarUploader } from "@/component/account/AvatarUploader"
import { NotLogin } from "@/component/account/NotLogin"
import { TitleBar } from "@pmate/uikit"
import { Female, Male, QuestionMarkSharp } from "@mui/icons-material"
import { PCHIPVER } from "@pmate/meta"
import { profileAtom, updateProfileAtom, userLogoutAtom } from "@pmate/account-sdk"
import { Logger } from "@pmate/utils"
import { useTranslation } from "@pmate/i18n"
import { Button, Divider, IconButton } from "@pmate/uikit"
import { useAtom, useAtomValue, useSetAtom } from "jotai"
import { useState } from "react"
import { EmailSetting } from "@pmate/uikit"
import { LangSettingComponent } from "@pmate/auth"
// import { accountAtom } from "@atom/userAtom"
const logger = Logger.getDebugger("UserCenter")
export const UserCenter = () => {
  const user = useAtomValue(profileAtom)
  const logout = useSetAtom(userLogoutAtom)
  const updateProfile = useSetAtom(updateProfileAtom)
  const setAccountModal = useSetAtom(userAccountModalAtom)
  const advMode = useAtomValue(userSettingsAtom("advancedMode"))
  const [lang, setLang] = useAtom(userSettingsAtom("uiLang"))
  const t = useTranslation()
  logger.log("advMode", advMode)

  if (!user) {
    return (
      <div>
        <TitleBar title={t("Not logged in")} />
        <NotLogin />
      </div>
    )
  }

  return (
    <div className="p-[15px]">
      <div className="flex items-center justify-start">
        <AvatarUploader />
        <div className="flex flex-col pl-[10px]">
          <div className="flex items-center">
            <span
              style={{
                fontSize: "18px",
              }}
            >
              {user.nickName}
            </span>
            <IconButton
              onClick={() => {
                setAccountModal((x) => {
                  return {
                    ...x,
                    open: true,
                    phase: AccountModalPhase.GenderSelector,
                    next: AccountModalPhase.Finish,
                  }
                })
              }}
            >
              {Boolean(!user.gender) && (
                <QuestionMarkSharp
                  sx={{
                    backgroundColor: "#f2f2f3",
                    borderRadius: "50%",
                    fill: "grey",
                  }}
                />
              )}
              {Boolean(user.gender && user.gender === "M") && (
                <Male
                  style={{
                    fill: "skyblue",
                  }}
                />
              )}
              {Boolean(user.gender && user.gender === "F") && (
                <Female
                  style={{
                    fill: "pink",
                  }}
                />
              )}
            </IconButton>
            <Button
              variant="plain"
              onClick={() => {
                setAccountModal((x) => {
                  return {
                    ...x,
                    open: true,
                    phase: AccountModalPhase.Nickname,
                  }
                })
              }}
            >
              {t("Change nickname")}
            </Button>
          </div>
          <span>
            {t("User Name")}: {user.userName}
          </span>
        </div>
      </div>
      <Divider />

      <LangSettingComponent
        label={t("UI Language")}
        value={lang}
        onChange={setLang}
      />
      <EmailSetting
        email={user.email}
        onUpdate={(nextEmail) => updateProfile(user.id, { email: nextEmail })}
      />

      <VersionAndDebug />

      {/* <Sync /> */}
      <div className="flex items-center justify-center">
        <Button
          onClick={() => {
            logout()
          }}
        >
          {t("Logout")}
        </Button>
      </div>
    </div>
  )
}

const VersionAndDebug = () => {
  const [count, setCount] = useState(0)
  const [advMode, setAdvMode] = useAtom(userSettingsAtom("advancedMode"))

  return (
    <div
      className="p-[10px]"
      onClick={() => {
        logger.log("click", count)
        if (count < 5) {
          setCount(count + 1)
        } else {
          setAdvMode(true)
        }
      }}
    >
      Version: {PCHIPVER}
    </div>
  )
}
