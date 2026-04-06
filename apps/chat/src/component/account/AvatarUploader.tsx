import { profileAtom, updateProfileAtom } from "@pmate/account-sdk"
import { ProfileService } from "@pmate/sdk"
import { Logger } from "@pmate/utils"
import { Avatar } from "@pmate/uikit"
import type { ReactNode } from "react"
import { useAtomValue, useSetAtom } from "jotai"
import { useSnackbar } from "@pmate/uikit"

const logger = Logger.getDebugger("AvatarUploader")

export const AvatarUploader = ({ badge }: { badge?: ReactNode }) => {
  const profile = useAtomValue(profileAtom)
  const userId = profile?.id ?? ""
  const { enqueueSnackbar } = useSnackbar()
  const updateInfo = useSetAtom(updateProfileAtom)

  const handleFileUpload = async (base64String: string) => {
    logger.log("start upload")
    if (!userId || !profile) return
    try {
      const url = await ProfileService.updateAvatar({
        user: userId,
        base64: base64String,
        filename: "avatar.png",
      })

      if (!url) {
        enqueueSnackbar("头像修改失败", { variant: "error" })
        return
      }
      await updateInfo(userId, { avatar: url })
      enqueueSnackbar("头像修改成功")
    } catch (ex: any) {
      if (ex.message) {
        enqueueSnackbar(ex.message, { variant: "error" })
      }
    }
  }

  return (
    <Avatar
      src={profile?.avatar}
      nickName={profile?.nickName || ""}
      className="!w-[3.6rem] !h-[3.6rem]"
      upload
      onUploadFile={handleFileUpload}
      badgeIcon={badge}
    />
  )
}
