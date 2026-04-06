import { AccountManagerV2, AccountService } from "@pmate/account-sdk"
import { useTranslation } from "@pmate/account-sdk"
import type { AuthLoginResponse } from "@pmate/meta"
import { Button, InputField, useSnackbar } from "@pmate/uikit"
import { useCallback, useRef } from "react"
import { useForm } from "react-hook-form"
import { useNavigate, useSearchParams } from "react-router-dom"
import { VCodeField } from "./VCodeField"

interface FieldValues {
  mobile: string
  vcode: string
}

export interface LoginFormProps {
  appId?: string
  appName?: string
  onLoginSuccess?: (state: AuthLoginResponse) => void
}

export const LoginForm = ({
  appId,
  appName,
  onLoginSuccess,
}: LoginFormProps) => {
  const {
    watch,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FieldValues>()

  const t = useTranslation()
  const { enqueueSnackbar } = useSnackbar()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const nonceRef = useRef("")
  const issuedAtRef = useRef("")

  const mobile = watch("mobile") || ""
  const vcode = watch("vcode") || ""

  const handleVCodeIssued = useCallback(
    ({ nonce, issuedAt }: { nonce: string; issuedAt: string }) => {
      nonceRef.current = nonce
      issuedAtRef.current = issuedAt
    },
    [],
  )

  const handleLogin = useCallback(async () => {
    try {
      const state = await AccountService.login({
        nonce: nonceRef.current,
        issuedAt: issuedAtRef.current,
        ...(appId ? { app: appId } : {}),
        body: {
          type: "sms",
          mobile,
          vcode,
        },
      })
      enqueueSnackbar(t("Login Success"), { variant: "success" })
      const manager = AccountManagerV2.get(appId)
      manager.setAuthToken(state.token)
      const profiles = await manager.getProfiles()
      if (profiles.length === 0) {
        const nextParams = new URLSearchParams()
        const appParam = appId ?? searchParams.get("app")
        const redirectParam = searchParams.get("redirect")
        if (appParam) {
          nextParams.set("app", appParam)
        }
        if (redirectParam) {
          nextParams.set("redirect", redirectParam)
        }
        navigate(`/create-profile?${nextParams.toString()}`, { replace: true })
        return
      }
      onLoginSuccess?.(state)
    } catch (error: unknown) {
      const ex = error as { message?: string }
      if (ex.message) {
        enqueueSnackbar(ex.message, { variant: "error" })
      }
    }
  }, [
    appId,
    enqueueSnackbar,
    mobile,
    navigate,
    onLoginSuccess,
    searchParams,
    t,
    vcode,
  ])

  const termsPrefix = t("By signing up, you agree with ", {
    appName: appName ?? "Parrot Mate",
  })

  return (
    <form
      onSubmit={handleSubmit(() => {
        if (mobile.length !== 11 || vcode.length !== 6) {
          return
        }
        return handleLogin()
      })}
      className="w-[20rem]"
    >
      <div className="mb-[1rem] flex justify-center align-center text-[0.875rem]">
        <InputField
          type="tel"
          placeholder={t("please enter your phone number")}
          {...register("mobile", {
            required: t("Please enter your phone number"),
          })}
          className={`w-[20rem] h-[2.75rem] px-4 py-3 ${
            errors.mobile ? "border-red-500" : ""
          }`}
        />
      </div>
      {errors.mobile && (
        <p className="text-red-500 text-sm mt-1">{errors.mobile.message}</p>
      )}

      <VCodeField
        type="number"
        {...register("vcode", {
          required: false,
        })}
        mobile={mobile}
        onVCodeIssued={handleVCodeIssued}
      />

      <div className="mt-[2.25rem] mb-[1rem]">
        <Button
          type="submit"
          disabled={mobile.length !== 11 || vcode.length !== 6}
          variant="plain"
          className="w-[20rem] h-[3rem] text-[1rem] rounded-4xl"
        >
          {t("Login")}
        </Button>
      </div>

      <div className="flex flex-col items-center text-white text-xs leading-tight">
        <label className="flex items-start gap-1">
          <span>
            {termsPrefix}
            <a href="#" className="underline text-white/90">
              {" " + t("Terms&Conditions") + " "}
            </a>
            {t("and")}
            <a href="#" className="underline text-white/90">
              {t("Privacy Policy")}
            </a>
          </span>
        </label>
        <p className="mt-1">
          {t("Unregistered phone numbers will automatically create an account")}
        </p>
      </div>
    </form>
  )
}
