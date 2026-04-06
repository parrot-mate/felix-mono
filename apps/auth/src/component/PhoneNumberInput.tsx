import { useForm } from "react-hook-form"
import { useEffect } from "react"

interface PhoneNumberSetterProps {
  onSubmit: (phone: string) => void
}

export const PhoneNumberSetter = ({ onSubmit }: PhoneNumberSetterProps) => {
  const {
    register,
    trigger,
    watch,
    formState: { errors },
  } = useForm<{ phone: string }>({
    mode: "onBlur",
    defaultValues: { phone: "" },
  })

  const phone = watch("phone")

  useEffect(() => {
    if (phone && phone.length === 11) {
      trigger("phone").then((valid) => {
        if (valid) {
          onSubmit(phone)
        }
      })
    }
  }, [onSubmit, phone, trigger])

  return (
    <>
      <div className="flex items-center justify-center w-full mb-1">
        <label className="flex-3 text-right shrink-0 mr-5">手机号:</label>
        <input
          {...register("phone", {
            required: "请输入手机号",
            minLength: { value: 11, message: "请输入正确的手机号" },
            maxLength: { value: 11, message: "请输入正确的手机号" },
          })}
          type="tel"
          maxLength={11}
          className="flex-7 border rounded p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          placeholder="请输入手机号"
        />
      </div>
      {errors.phone && (
        <div className="flex items-center justify-center w-full mb-4">
          <div className="flex-3" />
          <span className="flex-7 text-red-500 text-sm">
            {errors.phone.message}
          </span>
        </div>
      )}
    </>
  )
}
