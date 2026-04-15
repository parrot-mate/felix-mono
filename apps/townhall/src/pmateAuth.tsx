import { createContext, useContext, useEffect, useMemo } from "react"
import type { PropsWithChildren } from "react"
import { useAuthApp } from "@pmate/account-sdk-internal/hooks/useAuthApp"
import { useAuthSnapshot } from "@pmate/account-sdk-internal/hooks/useAuthSnapshot"
import type { AccountSnapshot } from "@pmate/account-sdk-internal/types/account.types"
import { AccountManagerV2 } from "@pmate/account-sdk-internal/utils/AccountManagerV2"

type TownhallAuthContextValue = {
  loading: boolean
  snapshot: AccountSnapshot
  token: string | null
  login: () => void
}

const TownhallAuthContext = createContext<TownhallAuthContextValue | null>(null)

export function TownhallAuthProvider({
  app,
  children,
}: PropsWithChildren<{ app: string }>) {
  const authApp = useAuthApp({ app })
  const isLocalPreview =
    typeof window !== "undefined" &&
    (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost")

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const params = new URLSearchParams(window.location.search)
    if (!params.has("sessionId")) {
      return
    }

    const manager = AccountManagerV2.get(app)
    manager.loginUrlSessionOverride().catch((error) => {
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

  const value = useMemo<TownhallAuthContextValue>(
    () => ({
      loading: isLocalPreview ? false : loading,
      snapshot: isLocalPreview
        ? ({
            account: {
              accountName: "Local Preview",
              token: "local-preview-token",
            },
          } as AccountSnapshot)
        : snapshot,
      token: isLocalPreview ? "local-preview-token" : snapshot.account?.token ?? null,
      login: () => authApp.login(),
    }),
    [authApp, isLocalPreview, loading, snapshot],
  )

  return <TownhallAuthContext.Provider value={value}>{children}</TownhallAuthContext.Provider>
}

export function useTownhallAuth() {
  const value = useContext(TownhallAuthContext)
  if (!value) {
    throw new Error("useTownhallAuth must be used inside TownhallAuthProvider")
  }
  return value
}
