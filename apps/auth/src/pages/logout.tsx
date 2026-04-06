import {
  AccountManagerV2,
  DEFAULT_APP_ID,
  getAppConfig,
} from "@pmate/account-sdk"
import { Logo } from "@pmate/uikit"
import { useEffect, useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

const buildBackgroundStyle = (background: string) => {
  return {
    backgroundColor: "#0b0b0b",
    backgroundImage: background,
    backgroundSize: "cover",
  }
}

export const LogoutPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const redirectTarget = searchParams.get("redirect") ?? ""
  const appParam = searchParams.get("app") ?? DEFAULT_APP_ID

  const appConfig = useMemo(() => {
    return getAppConfig(appParam)
  }, [appParam])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        const manager = AccountManagerV2.get(appConfig.id)
        await manager.logout()
      } finally {
        if (cancelled) {
          return
        }
        const nextParams = new URLSearchParams()
        nextParams.set("app", appConfig.id)
        if (redirectTarget) {
          nextParams.set("redirect", redirectTarget)
        }
        navigate(`/login?${nextParams.toString()}`, { replace: true })
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [appConfig.id, navigate, redirectTarget])

  const pageStyle = useMemo(() => {
    return buildBackgroundStyle(appConfig.background)
  }, [appConfig.background])

  return (
    <div className="bg-cover bg-center h-screen w-full" style={pageStyle}>
      <div className="flex items-center justify-center pt-[4.75rem]">
        <Logo src={appConfig.icon} className="w-[5.875rem] h-[5.875rem]" />
      </div>
      <div className="mt-[2.25rem] text-center text-sm text-white/80">
        Signing you out...
      </div>
    </div>
  )
}
