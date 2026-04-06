import { profileAtom, updateProfileAtom, uploadAvatarAtom } from "@pmate/account-sdk"
import { Avatar, useSnackbar } from "@pmate/uikit"
import { useAtomValue, useSetAtom } from "jotai"

export const AvatarSetter = () => {
  const user = useAtomValue(profileAtom)
  const userId = user?.id ?? ""
  const updateProfile = useSetAtom(updateProfileAtom)
  const uploadAvatar = useSetAtom(uploadAvatarAtom)
  const { enqueueSnackbar } = useSnackbar()

  const handleFile = async (file: File) => {
    if (!user || !userId) {
      enqueueSnackbar("用户信息缺失", { variant: "error" })
      return
    }

    try {
      const avatarUrl = await uploadAvatar({ file, userId })
      if (!avatarUrl) {
        enqueueSnackbar("上传失败，请重试", { variant: "error" })
        return
      }

      await updateProfile(userId, { avatar: avatarUrl })
      enqueueSnackbar("头像已更新", { variant: "success" })
    } catch {
      enqueueSnackbar("上传失败，请重试", { variant: "error" })
    }
  }

  return (
    <div className="flex items-center w-full mb-4">
      <label className="flex-3 text-right shrink-0 mr-5">头像:</label>
      <div className="flex-7">
        <label className="relative inline-block cursor-pointer">
          <Avatar
            src={user?.avatar}
            nickName={user?.nickName || ""}
            className="w-20 h-20"
          />
          <input
            type="file"
            accept="image/*"
            className="absolute inset-0 opacity-0"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) {
                handleFile(file)
              }
            }}
          />
        </label>
      </div>
    </div>
  )
}
