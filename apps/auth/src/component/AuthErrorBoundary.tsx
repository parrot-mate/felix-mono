import { NotAuthenticatedError, userLogoutAtom } from "@pmate/account-sdk"
import { useSetAtom } from "jotai"
import { Component, PropsWithChildren, useCallback } from "react"
import { useNavigate } from "react-router-dom"

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

export const AuthErrorBoundary = ({ children }: PropsWithChildren) => {
  const navigate = useNavigate()
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
