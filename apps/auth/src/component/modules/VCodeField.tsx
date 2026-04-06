import { useTranslation } from "@pmate/account-sdk"
import type { InputFieldProps } from "@pmate/uikit"
import { Button, InputField } from "@pmate/uikit"
import { forwardRef, useEffect, useState } from "react"

interface VCodeFieldProps {
  onRequestVCode: () => void | Promise<void>
}

export const VCodeField = forwardRef<
  HTMLInputElement,
  VCodeFieldProps & InputFieldProps
>(({ onRequestVCode, className, ...rest }, ref) => {
  const [countDown, setCountDown] = useState(0)
  const t = useTranslation()

  useEffect(() => {
    if (countDown > 0) {
      const timer = setTimeout(() => {
        setCountDown((value) => value - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [countDown])

  return (
    <div className="flex items-center text-[0.875rem]">
      <div className="w-[13rem] h-[2.75rem] mr-5">
        <InputField
          ref={ref}
          placeholder={t("Please enter the verification code")}
          {...rest}
          className={`w-[13rem] h-[2.75rem] px-4 py-3 ${className ?? ""}`}
        />
      </div>

      <div className="w-[6.25rem] h-[2.75rem] relative">
        <Button
          className="w-full h-full p-3 text-[0.875rem] text-center relative disabled:bg-gray-300"
          disabled={countDown > 0}
          onClick={() => {
            setCountDown(60)
            void onRequestVCode()
          }}
          variant="accent"
        >
          <span className="invisible">{t("Send verification code")}</span>
          <span className="absolute inset-0 flex items-center justify-center">
            {countDown > 0 ? `${countDown} ${t("seconds")}` : t("Send Code")}
          </span>
        </Button>
      </div>
    </div>
  )
})

VCodeField.displayName = "VCodeField"
