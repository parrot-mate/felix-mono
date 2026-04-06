import { AccountModalPhase, userAccountModalAtom } from "@/atom/modalAtoms"

import { EmailSetting } from "@pmate/uikit"
import { AvatarUploader } from "@/component/account/AvatarUploader"
import { NotLogin } from "@/component/account/NotLogin"
import {
  Button,
  Divider,
  IconButton,
  IconFemale,
  IconMale,
  IconQuestion,
  TitleBar,
} from "@pmate/uikit"
import { PCHIPVER } from "@pmate/meta"
import {
  profileAtom,
  updateProfileAtom,
  userLogoutAtom,
  userSettingsAtom,
} from "@pmate/account-sdk"
import { Logger } from "@pmate/utils"
import { useTranslation } from "@pmate/i18n"
import { useAtom, useAtomValue, useSetAtom } from "jotai"
import { useState } from "react"
// import { accountAtom } from "@atom/userAtom"
const logger = Logger.getDebugger("UserCenter")
export const UserCenter = () => {
  const profile = useAtomValue(profileAtom)
  const logout = useSetAtom(userLogoutAtom)
  const updateProfile = useSetAtom(updateProfileAtom)
  const setAccountModal = useSetAtom(userAccountModalAtom)
  const advMode = useAtomValue(userSettingsAtom("advancedMode"))
  const t = useTranslation()
  logger.log("advMode", advMode)

  if (!profile) {
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
              {profile.nickName}
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
              {Boolean(!profile.gender) && (
                <IconQuestion className="bg-[#f2f2f3] rounded-full text-gray-500 w-6 h-6" />
              )}
              {Boolean(profile.gender && profile.gender === "M") && (
                <IconMale className="text-sky-400 w-6 h-6" />
              )}
              {Boolean(profile.gender && profile.gender === "F") && (
                <IconFemale className="text-pink-400 w-6 h-6" />
              )}
            </IconButton>
          </div>
          <span>
            {t("User Name")}: {profile.userName}
            <a
              onClick={() => {
                navigator.clipboard.writeText(profile.userName || "")
              }}
              className="text-blue-500"
            >
              {t("copy")}
            </a>
          </span>
        </div>
      </div>
      <Divider />

      <EmailSetting
        email={profile.email}
        onUpdate={(nextEmail) => updateProfile(profile.id, { email: nextEmail })}
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
