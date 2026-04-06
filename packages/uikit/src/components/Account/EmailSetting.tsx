import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useSnackbar } from "../SnackBar"

type EmailSettingProps = {
  email?: string
  onUpdate?: (nextEmail: string) => void | Promise<void>
  label?: string
}

export const EmailSetting = ({
  email,
  onUpdate,
  label = "邮箱:",
}: EmailSettingProps) => {
  const { enqueueSnackbar } = useSnackbar()
  const {
    register,
    trigger,
    setValue,
    formState: { errors },
  } = useForm<{ email: string }>({
    mode: "onBlur",
    defaultValues: { email },
  })

  useEffect(() => {
    if (email !== undefined) {
      setValue("email", email)
    }
  }, [email, setValue])

  return (
    <>
      <div className="flex items-center w-full mb-1">
        <label className="flex-3 text-right shrink-0 mr-5">{label}</label>
        <input
          {...register("email", {
            required: "请输入邮箱",
            pattern: {
              value: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
              message: "邮箱格式错误",
            },
          })}
          type="email"
          className="flex-7 w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          placeholder="请输入邮箱"
          onBlur={async (event) => {
            const valid = await trigger("email")
            const value = event.target.value
            if (valid && onUpdate) {
              try {
                await onUpdate(value)
                enqueueSnackbar("邮箱已更新", { variant: "success" })
              } catch (error: any) {
                enqueueSnackbar(error?.message || "更新失败", {
                  variant: "error",
                })
              }
            }
          }}
        />
      </div>
      {errors.email && (
        <div className="flex items-center w-full mb-4">
          <div className="flex-3" />
          <span className="flex-7 text-red-500 text-sm">
            {errors.email.message}
          </span>
        </div>
      )}
    </>
  )
}
