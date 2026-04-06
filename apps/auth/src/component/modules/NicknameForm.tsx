import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { useTranslation } from "@pmate/account-sdk"
import { Button, InputField } from "@pmate/uikit"
import { NicknameSelector } from "@pmate/uikit"

interface NicknameFormProps {
  initialValue: string
  onFinished: (nickName: string) => void | Promise<void>
}

export const NicknameForm = ({
  initialValue,
  onFinished,
}: NicknameFormProps) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<{ nickName: string }>({
    defaultValues: { nickName: initialValue },
  })

  const t = useTranslation()

  useEffect(() => {
    setValue("nickName", initialValue)
  }, [initialValue, setValue])

  const handlePresetSelect = (name: string) => {
    setValue("nickName", name, { shouldValidate: true })
  }

  return (
    <div>
      <div className="flex flex-col items-center">
        <Controller
          name="nickName"
          control={control}
          rules={{
            required: t("Nickname is required"),
            minLength: {
              value: 3,
              message: t("Nickname must be at least 3 characters"),
            },
          }}
          render={({ field }) => (
            <InputField
              {...field}
              type="text"
              placeholder={t("Enter your nickname here...")}
              className="w-[22rem] h-[3rem] pl-[1rem]"
            />
          )}
        />
        {errors.nickName && (
          <div className="text-red-500">{errors.nickName.message}</div>
        )}
      </div>

      <Controller
        name="nickName"
        control={control}
        render={({ field }) => (
          <NicknameSelector
            className="mt-[1.5rem]"
            {...field}
            onChange={(event) => {
              field.onChange(event)
              handlePresetSelect(event.target.value)
            }}
          />
        )}
      />

      <div className="flex items-center justify-center">
        <Button
          className="w-[22rem] h-[3.125rem] text-[1rem] mt-[4.75rem]"
          variant="step"
          onClick={handleSubmit((data) => onFinished(data.nickName))}
        >
          {t("Confirm")}
        </Button>
      </div>
    </div>
  )
}
