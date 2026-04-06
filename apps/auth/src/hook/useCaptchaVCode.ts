import { useCallback, useEffect, useRef, useState } from "react"

const CAPTCHA_ELEMENT_ID = "pmate-captcha-element"
const CAPTCHA_BUTTON_ID = "pmate-captcha-button"
const CAPTCHA_PREFIX = "1o9oka"
const CAPTCHA_SCENE_ID = "1x50mrgs"
type SnackbarVariant = "success" | "error" | "info"

type CaptchaVerifyResult = {
  captchaResult: boolean
  bizResult?: boolean
}

interface RequestVCodePayload {
  mobile: string
  purpose: "login"
  captchaToken: string
  captchaScene?: string
}

interface UseCaptchaVCodeOptions {
  mobile: string
  enqueueSnackbar: (
    message: string,
    options: { variant: SnackbarVariant },
  ) => void
  t: (key: string, params?: Record<string, unknown>) => string
  requestVCode: (payload: RequestVCodePayload) => Promise<{
    nonce: string
    issuedAt: string
  }>
  onVCodeIssued?: (payload: { nonce: string; issuedAt: string }) => void
}

export const useCaptchaVCode = ({
  mobile,
  enqueueSnackbar,
  t,
  requestVCode,
  onVCodeIssued,
}: UseCaptchaVCodeOptions) => {
  const [countDown, setCountDown] = useState(0)
  const nonceRef = useRef("")
  const issuedAtRef = useRef("")
  const captchaInstanceRef = useRef<unknown>(null)
  const mobileRef = useRef(mobile)
  const enqueueSnackbarRef = useRef(enqueueSnackbar)
  const [isCaptchaReady, setIsCaptchaReady] = useState(false)
  const issueVCodeRef = useRef<
    (captchaVerifyParam: string) => Promise<CaptchaVerifyResult>
  >(async () => ({ captchaResult: false, bizResult: false }))
  const resolveCaptchaRef = useRef<(ok: boolean) => void>(() => {})

  useEffect(() => {
    mobileRef.current = mobile
  }, [mobile])

  useEffect(() => {
    enqueueSnackbarRef.current = enqueueSnackbar
  }, [enqueueSnackbar])

  const issueVCode = useCallback(
    async (captchaVerifyParam: string): Promise<CaptchaVerifyResult> => {
      const nextMobile = mobileRef.current
      if (nextMobile.length !== 11) {
        enqueueSnackbar(t("Please enter the correct phone number"), {
          variant: "error",
        })
        return { captchaResult: false, bizResult: false }
      }

      try {
        const payload = {
          mobile: nextMobile,
          purpose: "login",
          captchaToken: captchaVerifyParam,
          ...(CAPTCHA_SCENE_ID ? { captchaScene: CAPTCHA_SCENE_ID } : {}),
        } as RequestVCodePayload
        const vcodeData = await requestVCode(payload)
        const { nonce, issuedAt } = vcodeData
        enqueueSnackbar(t("Verification code sent"), {
          variant: "success",
        })
        nonceRef.current = nonce
        issuedAtRef.current = issuedAt
        onVCodeIssued?.({ nonce, issuedAt })
        setCountDown(60)
        return { captchaResult: true, bizResult: true }
      } catch (error: unknown) {
        const ex = error as { message?: string }
        if (ex.message) {
          enqueueSnackbar(ex.message, { variant: "error" })
        }
        return { captchaResult: false, bizResult: false }
      }
    },
    [enqueueSnackbar, onVCodeIssued, requestVCode, t],
  )

  useEffect(() => {
    issueVCodeRef.current = issueVCode
  }, [issueVCode])

  const initCaptcha = useCallback(() => {
    console.log("[captcha] initCaptcha called")
    // @ts-ignore
    window.initAliyunCaptcha({
      SceneId: CAPTCHA_SCENE_ID,
      mode: "popup",
      element: `#${CAPTCHA_ELEMENT_ID}`,
      button: `#${CAPTCHA_BUTTON_ID}`,
      success: async (captchaVerifyParam: string) => {
        console.log("[captcha] captchaVerifyCallback called")
        return issueVCodeRef.current(captchaVerifyParam)
      },
      // onBizResultCallback: (bizResult: boolean) => {
      //   console.log("[captcha] onBizResultCallback", { bizResult })
      //   resolveCaptchaRef.current(bizResult === true)
      // },
      fail: (error: unknown) => {
        console.log("[captcha] onError", error)
      },
      getInstance: (instance: unknown) => {
        // @ts-ignore
        console.log("verify exists", instance?.verify)
        captchaInstanceRef.current = instance
        setIsCaptchaReady(true)
        return instance
      },
      slideStyle: {
        width: 320,
        height: 40,
      },
    })
  }, [])

  useEffect(() => {
    initCaptcha()
  }, [])

  useEffect(() => {
    if (countDown > 0) {
      const timer = setTimeout(() => {
        setCountDown((value) => value - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [countDown])

  const checkMobile = useCallback(() => {
    if (mobile.length !== 11) {
      enqueueSnackbar(t("Please enter the correct phone number"), {
        variant: "error",
      })
      return false
    }
    return true
  }, [enqueueSnackbar, mobile, t])

  const handleRequestVCode = useCallback(async () => {
    console.log("[captcha] handleRequestVCode called")
    if (!checkMobile()) {
      return false
    }

    if (!CAPTCHA_PREFIX || !CAPTCHA_SCENE_ID) {
      enqueueSnackbar("Captcha is not configured", { variant: "error" })
      return false
    }

    console.log("[captcha] instance", captchaInstanceRef.current)
  }, [checkMobile, enqueueSnackbar, captchaInstanceRef.current, initCaptcha])

  return {
    countDown,
    captchaButtonId: CAPTCHA_BUTTON_ID,
    captchaElementId: CAPTCHA_ELEMENT_ID,
    handleRequestVCode,
    isCaptchaReady,
    nonceRef,
    issuedAtRef,
  }
}
