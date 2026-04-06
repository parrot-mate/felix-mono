import React from "react"
import { ThemeProvider } from "./ThemeProvider"

export function withThemeProvider<T extends object>(
  Component: React.ComponentType<T>
): React.FC<T> {
  return function WrappedComponent(props: T) {
    return (
      <ThemeProvider>
        <Component {...props} />
      </ThemeProvider>
    )
  }
}
