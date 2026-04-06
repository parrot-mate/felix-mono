import { profileAtom, updateProfileAtom } from "@pmate/account-sdk"
import { Button, InputField, useSnackbar } from "@pmate/uikit"
import { Logger } from "@pmate/utils"
import { useAtomValue, useSetAtom } from "jotai"
import { useForm } from "react-hook-form"

const logger = Logger.getDebugger("NicknameModifier")

export const NicknameModifier = ({ onFinish }: { onFinish: () => void }) => {
  const user = useAtomValue(profileAtom)
  const userId = user?.id ?? ""
  const { enqueueSnackbar } = useSnackbar()
  const updateProfile = useSetAtom(updateProfileAtom)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      nickName: user?.nickName,
    },
  })

  if (!user || !userId) {
    return null
  }

  logger.log(errors)
  return (
    <div className="flex flex-col p-5">
      <InputField
        {...register("nickName", {
          minLength: {
            value: 3,
            message: "昵称长度至少3个字符",
          },
        })}
      />

      {errors.nickName && (
        <div className="text-red-500">昵称长度至少3个字符</div>
      )}

      <div className="flex items-center justify-center">
        <Button
          disabled={Object.keys(errors).length > 0}
          onClick={handleSubmit(async (data) => {
            try {
              await updateProfile(userId, { nickName: data.nickName })
              enqueueSnackbar("昵称修改成功", { variant: "success" })
              onFinish()
            } catch (error: any) {
              if (error?.message) {
                enqueueSnackbar(error.message, { variant: "error" })
              }
            }
          })}
        >
          确认
        </Button>
      </div>
    </div>
  )
}
