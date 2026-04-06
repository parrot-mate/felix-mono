import { LoginForm } from "@/component/LoginForm"
import {
  AccountManagerV2,
  DEFAULT_APP_ID,
  getAppConfig,
} from "@pmate/account-sdk"
import { useTranslation } from "@pmate/account-sdk"
import { Logo } from "@pmate/uikit"
import { Suspense, useCallback, useEffect, useMemo } from "react"
import { useSearchParams } from "react-router-dom"

const SESSION_PARAM = "sessionId"

const buildRedirectUrl = (target: string, sessionId: string) => {
  try {
    const url = new URL(target, window.location.origin)
    url.searchParams.set(SESSION_PARAM, sessionId)
    return url.toString()
  } catch {
    const fallback = new URL(window.location.origin)
    fallback.searchParams.set(SESSION_PARAM, sessionId)
    return fallback.toString()
  }
}

const buildBackgroundStyle = (background: string) => {
  return {
    backgroundColor: "#0b0b0b",
    backgroundImage: background,
    backgroundSize: "cover",
  }
}

export const LoginPage = () => {
  const t = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()

  const appParam = useMemo(() => {
    return searchParams.get("app")
  }, [searchParams])

  const appConfig = useMemo(() => {
    return getAppConfig(appParam)
  }, [appParam])

  const redirectTarget = useMemo(() => {
    return searchParams.get("redirect")
  }, [searchParams])

  useEffect(() => {
    if (appParam !== null) {
      return
    }
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set("app", DEFAULT_APP_ID)
    setSearchParams(nextParams, { replace: true })
  }, [appParam, searchParams, setSearchParams])

  const redirectWithSession = useCallback(
    (sessionId: string) => {
      if (redirectTarget) {
        const url = buildRedirectUrl(redirectTarget, sessionId)
        window.location.assign(url)
        console.log("Redirecting to target with session:", {
          url,
        })
      }
    },
    [redirectTarget]
  )

  useEffect(() => {
    const checkSession = async () => {
      const mgr = AccountManagerV2.get(appConfig.id)
      console.log("Checking existing session for app:", appConfig.id)
      const token = mgr.getAuthToken()
      console.log("Found existing token:", { token })
      if (token) {
        const session = await mgr.session()
        if (session) {
          redirectWithSession(token)
        }
      }
    }
    checkSession()
  }, [])

  const pageStyle = useMemo(() => {
    return buildBackgroundStyle(appConfig.background)
  }, [appConfig.background])

  return (
    <div className="bg-cover bg-center h-screen w-full" style={pageStyle}>
      <div className="flex items-center justify-center">
        <Logo
          src={appConfig.icon}
          className="mt-[4.75rem] w-[5.875rem] h-[5.875rem]"
        />
      </div>

      <div className="text-[1.375rem] text-white font-bold text-center mt-[1.75rem] mb-[2.6875rem] px-6">
        {t(appConfig.welcomeText)}
      </div>

      <div className="flex items-center justify-center">
        <Suspense fallback={null}>
          <LoginForm
            appId={appConfig.id}
            appName={appConfig.name}
            onLoginSuccess={(state) => {
              console.log("Login successful:", state)
              AccountManagerV2.get(appConfig.id).setAuthToken(state.token)
              redirectWithSession(state.token)
            }}
          />
        </Suspense>
      </div>
    </div>
  )
}
