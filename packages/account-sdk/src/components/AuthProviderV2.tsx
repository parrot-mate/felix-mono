import { Button } from "./Button"
import { Drawer } from "./Drawer"
import { useSetAtom } from "jotai"
import {
  Component,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useAuthSnapshot } from "../hooks/useAuthSnapshot"
import { accountAtom } from "../atoms/accountAtom"
import { AccountLifecycleState } from "../types/account.types"
import { userLogoutAtom } from "../atoms/userLogoutAtom"
import { Redirect } from "../utils/Redirect"
import { NotAuthenticatedError } from "../utils/errors"
import {
  getWindowPathname,
  subscribeToLocationChange,
} from "../utils/location"

export type AuthRoute =
  | string
  | {
      path: string
      behavior?: "redirect" | "prompt"
    }

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const matchRoutePath = (pattern: string, pathname: string) => {
  if (pattern === "*") {
    return true
  }
  if (pattern === "/") {
    return pathname === "/"
  }
  const segments = pattern.split("/").filter(Boolean)
  const parts = segments.map((segment) => {
    if (segment === "*") {
      return ".*"
    }
    if (segment.startsWith(":")) {
      return "[^/]+"
    }
    return escapeRegExp(segment)
  })
  const regex = new RegExp(`^/${parts.join("/")}$`)
  return regex.test(pathname)
}

const getAuthBehaviors = (
  authRoutes: AuthRoute[] | undefined,
  pathname: string
) => {
  const matchedAuthRoute = authRoutes?.find((route) => {
    const path = typeof route === "string" ? route : route.path
    return matchRoutePath(path, pathname)
  })
  const authBehavior =
    matchedAuthRoute && typeof matchedAuthRoute !== "string"
      ? (matchedAuthRoute.behavior ?? "prompt")
      : "prompt"
  const requiresAuth = Boolean(matchedAuthRoute)
  return {
    authBehavior,
    requiresAuth,
  }
}

type AuthProviderV2Props = PropsWithChildren<{
  app: string
  authRoutes?: AuthRoute[]
  onLoginSuccess?: () => void | Promise<void>
  rtcProvider?: React.ComponentType<{ children: React.ReactNode }>
  pathname?: string
  navigate?: (to: string, options?: { replace?: boolean }) => void
}>

const useWindowPathname = () => {
  const [pathname, setPathname] = useState(getWindowPathname())
  useEffect(() => {
    const update = () => setPathname(getWindowPathname())
    const unsubscribe = subscribeToLocationChange(update)
    return () => unsubscribe()
  }, [])
  return pathname
}

export const AuthProviderV2 = ({
  app,
  authRoutes,
  rtcProvider: RtcProvider,
  pathname: pathnameProp,
  navigate: navigateProp,
  children,
}: AuthProviderV2Props) => {
  const pathname = pathnameProp ?? useWindowPathname()
  const navigate = useMemo(() => {
    if (navigateProp) {
      return navigateProp
    }
    return (to: string, options?: { replace?: boolean }) => {
      if (options?.replace) {
        window.location.replace(to)
        return
      }
      window.location.assign(to)
    }
  }, [navigateProp])
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false)
  const [isLoginErrorDismissed, setIsLoginErrorDismissed] = useState(false)
  const setAccountSnapshot = useSetAtom(accountAtom)
  const { authBehavior, requiresAuth } = getAuthBehaviors(
    authRoutes,
    pathname
  )
  const { loading, snapshot } = useAuthSnapshot({
    app,
    behaviors: {
      authBehavior,
      requiresAuth,
    },
  })
  const loginError = snapshot.error
  const hasAccount =
    snapshot.state === AccountLifecycleState.Idle
      ? null
      : Boolean(snapshot.account)

  useEffect(() => {
    setAccountSnapshot(snapshot)
  }, [setAccountSnapshot, snapshot])

  useEffect(() => {
    if (!requiresAuth || loading) {
      return
    }
    if (
      snapshot.account &&
      snapshot.profiles.length === 0 &&
      pathname !== "/create-profile"
    ) {
      Redirect.toCreateProfile(app)
      return
    }
    if (!snapshot.account && authBehavior === "redirect") {
      Redirect.toLogin(app)
    }
  }, [
    app,
    authBehavior,
    loading,
    pathname,
    requiresAuth,
    snapshot.account,
    snapshot.profiles.length,
  ])

  useEffect(() => {
    if (loading) {
      return
    }
    setIsLoginPromptOpen(
      requiresAuth && !snapshot.account && authBehavior === "prompt",
    )
  }, [authBehavior, loading, requiresAuth, snapshot.account])
  useEffect(() => {
    if (!loginError) {
      setIsLoginErrorDismissed(false)
    }
  }, [loginError])

  const handleBack = () => {
    setIsLoginPromptOpen(false)
    if (window.history.length > 1) {
      window.history.back()
      return
    }
    // window.location.href = "/"
  }

  if (loading && requiresAuth) {
    return null
  }
  if (loginError && requiresAuth && !isLoginErrorDismissed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-xl border border-rose-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold text-rose-600">
            Login failed
          </div>
          <p className="mt-2 text-sm text-slate-600">
            We could not restore your session. Please try again.
          </p>
          <div className="mt-3 text-xs text-rose-500">{loginError.message}</div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className="rounded-md bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700"
              type="button"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    )
  }
  if (requiresAuth && hasAccount === null) {
    return null
  }
  if (requiresAuth && hasAccount === false && authBehavior === "prompt") {
    return (
      <Drawer
        open={isLoginPromptOpen}
        onClose={handleBack}
        anchor="bottom"
        overlayClassName="bg-black/40"
      >
        <div className="rounded-t-2xl px-6 pb-6 pt-4">
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200" />
          <div className="text-lg font-semibold text-slate-900">
            You need login to continue ?
          </div>
          <div className="mt-5 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="plain"
              className="min-w-[96px] justify-center"
              onClick={handleBack}
            >
              Back
            </Button>
            <Button
              type="button"
              className="min-w-[96px] justify-center"
              onClick={() => Redirect.toLogin(app)}
            >
              Login
            </Button>
          </div>
        </div>
      </Drawer>
    )
  }
  if (!requiresAuth) {
    return children
  }
  const RtcWrapper = RtcProvider ?? (({ children }) => <>{children}</>)
  return (
    <AuthErrorBoundary navigate={navigate}>
      <RtcWrapper>{children}</RtcWrapper>
    </AuthErrorBoundary>
  )
}

interface AuthErrorBoundaryState {
  hasError: boolean
}

interface AuthErrorBoundaryProps extends PropsWithChildren {
  onAuthError: () => Promise<void>
}

class AuthErrorBoundaryInner extends Component<
  AuthErrorBoundaryProps,
  AuthErrorBoundaryState
> {
  state: AuthErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): AuthErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    if (error instanceof NotAuthenticatedError) {
      this.props.onAuthError().then(() => {
        this.setState({ hasError: false })
      })
      return
    }

    console.error(error)
  }

  render() {
    if (this.state.hasError) {
      return null
    }

    return this.props.children
  }
}

const AuthErrorBoundary = ({
  children,
  navigate,
}: PropsWithChildren<{
  navigate: (to: string, options?: { replace?: boolean }) => void
}>) => {
  const logout = useSetAtom(userLogoutAtom)
  const handleAuthError = useCallback(async () => {
    await logout()
    navigate("/login", { replace: true })
  }, [logout, navigate])

  return (
    <AuthErrorBoundaryInner onAuthError={handleAuthError}>
      {children}
    </AuthErrorBoundaryInner>
  )
}
