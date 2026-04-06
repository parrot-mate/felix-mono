import { useTranslation } from "@pmate/account-sdk"
import { Button, InputField, InputFieldProps, useSnackbar } from "@pmate/uikit"
import { useSetAtom } from "jotai"
import { memo } from "react"
import { vcodeAtom } from "../atom/auth"
import { useCaptchaVCode } from "../hook/useCaptchaVCode"

interface VCodeFieldProps {
  mobile: string
  onVCodeIssued?: (payload: { nonce: string; issuedAt: string }) => void
}

export const VCodeField = memo(
  ({
    className,
    mobile,
    onVCodeIssued,
    ...rest
  }: VCodeFieldProps & InputFieldProps) => {
    const t = useTranslation()
    const { enqueueSnackbar } = useSnackbar()
    const requestVCode = useSetAtom(vcodeAtom)

    const { captchaButtonId, captchaElementId, countDown, isCaptchaReady } =
      useCaptchaVCode({
        mobile,
        enqueueSnackbar,
        t,
        requestVCode,
        onVCodeIssued,
      })

    return (
      <div className="flex items-center text-[0.875rem]">
        <div id={captchaElementId} className="h-0 w-0 overflow-hidden" />
        <div className="w-[13rem] h-[2.75rem] mr-5">
          <InputField
            placeholder={t("Please enter the verification code")}
            {...rest}
            className={`w-[13rem] h-[2.75rem] px-4 py-3 ${className ?? ""}`}
          />
        </div>

        <div className="w-[6.25rem] h-[2.75rem] relative">
          <Button
            className="w-full h-full p-3 text-[0.875rem] text-center relative disabled:bg-gray-300"
            disabled={!isCaptchaReady || countDown > 0}
            id={captchaButtonId}
            // onClick={async () => {
            //   try {
            //     await wait(1000)
            //     const shouldStart = await handleRequestVCode()
            //     if (shouldStart !== false) {
            //       setCountDown(60)
            //     }
            //   } catch {
            //     return
            //   }
            // }}
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
  },
)
