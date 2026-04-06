import { Box } from "@mui/material"
import { useTranslation } from "@pmate/i18n"
import type { InputFieldProps } from "@pmate/uikit"
import { Button, InputField } from "@pmate/uikit"
import { forwardRef, useEffect, useState } from "react"

interface VCodeFieldProps {
  onRequestVCode: () => void
}

export const VCodeField = forwardRef<
  HTMLInputElement,
  VCodeFieldProps & InputFieldProps
>(({ onRequestVCode, ...rest }, ref) => {
  const [countDown, setCountDown] = useState(0)
  const t = useTranslation()

  useEffect(() => {
    if (countDown > 0) {
      const timer = setTimeout(() => {
        setCountDown((x) => x - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [countDown])

  return (
    <>
      <Box className="flex items-center text-[0.875rem]">
        <div className="w-[13rem] h-[2.75rem] mr-5">
          <InputField
            ref={ref}
            placeholder="请输入验证码"
            {...rest}
            className="w-[13rem] h-[2.75rem] px-4 py-3"
          />
        </div>

        {/* <div className="w-[6.25rem] h-[2.75rem]">
            <Button
              className="w-full h-full p-3 text-[0.875rem]"
              disabled={countDown > 0}
              onClick={() => {
                setCountDown(60)
                onRequestVCode()
              }}
              variant="accent"
            >
              {countDown > 0 ? `${countDown}` : "发送验证码"}
            </Button>
          </div> */}
        <div className="w-[6.25rem] h-[2.75rem] relative">
          <Button
            className="w-full h-full p-3 text-[0.875rem] text-center relative"
            disabled={countDown > 0}
            onClick={() => {
              setCountDown(60)
              onRequestVCode()
            }}
            variant="accent"
          >
            {/* 占位用的隐藏文字，撑开宽度 */}
            <span className="invisible">{t("Send Code")}</span>

            {/* 实际显示内容，叠在占位文字上 */}
            <span className="absolute inset-0 flex items-center justify-center">
              {countDown > 0 ? `${countDown} ${t("seconds")}` : t("Send Code")}
            </span>
          </Button>
        </div>
      </Box>
      {/* <div className="w-[6.25rem] bg-yellow-200">
          <button className="w-full h-full p-3 text-[0.875rem] bg-violet-500 text-white">
            {countDown > 0 ? `${countDown} 秒` : "发送验证码"}
          </button>
        </div> */}
      {/* <div className="w-[6.25rem] bg-yellow-200">
          <button className="border border-red-500 w-full h-full relative">
            <span className="absolute left-0 right-0 top-0 bottom-0 border border-green-500">
              测试文字
            </span>
          </button>
        </div> */}
    </>
  )
})

VCodeField.displayName = "VCodeField"
