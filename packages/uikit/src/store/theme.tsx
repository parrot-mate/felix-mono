import React, { createContext, useContext } from "react"

export type ThemeType = "light" | "dark"

const ThemeContext = createContext<ThemeType>("light")

export interface UikitThemeProviderProps {
  children: React.ReactNode
  value?: ThemeType
}

export function UikitThemeProvider({
  children,
  value = "light",
}: UikitThemeProviderProps): JSX.Element {
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useUikitTheme(): ThemeType {
  return useContext(ThemeContext)
}

export { ThemeContext }
