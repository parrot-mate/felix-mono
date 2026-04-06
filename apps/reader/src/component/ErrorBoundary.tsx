import React, { Component, ErrorInfo, ReactNode, Suspense } from "react"
import { GlobalLoading } from "./GlobalLoading"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, errorInfo: null }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    // console.log({ error, errorInfo })
    console.error(error)
    console.error(errorInfo)
    this.setState({ errorInfo })
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div>
          <h2>Something went wrong.</h2>
          <details style={{ whiteSpace: "pre-wrap" }}>
            {showError(this.state.error)}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      )
    }

    return (
      <Suspense fallback={<GlobalLoading />}>{this.props.children}</Suspense>
    )
  }
}

function showError(error: any) {
  if (!error) {
    return ""
  }
  if (error instanceof Error) {
    return error.message
  }
  return JSON.stringify(error)
}

export default ErrorBoundary
