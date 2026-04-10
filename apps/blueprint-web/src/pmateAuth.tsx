import { createContext, useContext, useEffect, useMemo } from "react"
import type { PropsWithChildren } from "react"
import { useAuthApp } from "@pmate/account-sdk-internal/hooks/useAuthApp"
import { useAuthSnapshot } from "@pmate/account-sdk-internal/hooks/useAuthSnapshot"
import type { AccountSnapshot } from "@pmate/account-sdk-internal/types/account.types"
import { AccountManagerV2 } from "@pmate/account-sdk-internal/utils/AccountManagerV2"

type BlueprintAuthContextValue = {
  loading: boolean
  snapshot: AccountSnapshot
  token: string | null
  login: () => void
}

const BlueprintAuthContext = createContext<BlueprintAuthContextValue | null>(null)

export function BlueprintAuthProvider({
  app,
  children,
}: PropsWithChildren<{
  app: string
}>) {
  const authApp = useAuthApp({ app })

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }
    const params = new URLSearchParams(window.location.search)
    if (!params.has("sessionId")) {
      return
    }
    const manager = AccountManagerV2.get(app)
    manager
      .loginUrlSessionOverride()
      .catch((error) => {
        console.warn("Failed to restore session from URL.", error)
      })
  }, [app])
  const { loading, snapshot } = useAuthSnapshot({
    app,
    behaviors: {
      authBehavior: "prompt",
      requiresAuth: false,
    },
  })

  const value = useMemo<BlueprintAuthContextValue>(
    () => ({
      loading,
      snapshot,
      token: snapshot.account?.token ?? null,
      login: () => authApp.login(),
    }),
    [authApp, loading, snapshot],
  )

  return <BlueprintAuthContext.Provider value={value}>{children}</BlueprintAuthContext.Provider>
}

export function useBlueprintAuth() {
  const value = useContext(BlueprintAuthContext)
  if (!value) {
    throw new Error("useBlueprintAuth must be used inside BlueprintAuthProvider")
  }
  return value
}
