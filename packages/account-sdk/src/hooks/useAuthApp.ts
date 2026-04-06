import { useCallback, useMemo } from "react"
import { DEFAULT_APP_ID } from "../app.config"
import { resolveAppId } from "../utils/resolveAppId"
import type { ProfileStepType } from "../utils/profileStep"

type UseAuthAppOptions = {
  app?: string
  redirect?: string
}

type AuthAppRedirectOptions = {
  app?: string
  redirect?: string
}

type AuthProfileRedirectOptions = AuthAppRedirectOptions & {
  step?: ProfileStepType
}

const AUTH_APP_BASE = "https://auth.pmate.chat"

const getDefaultRedirect = () => {
  if (typeof window === "undefined") {
    return ""
  }
  return window.location.href
}

export const useAuthApp = (options: UseAuthAppOptions = {}) => {
  const app = resolveAppId(options.app ?? DEFAULT_APP_ID)
  const redirect = useMemo(
    () => options.redirect ?? getDefaultRedirect(),
    [options.redirect]
  )

  const buildUrl = useCallback(
    (path = "/", overrides: AuthAppRedirectOptions = {}) => {
      const targetRedirect = overrides.redirect ?? redirect
      const targetApp = overrides.app ?? app
      const url = new URL(path, AUTH_APP_BASE)
      if (targetRedirect) {
        url.searchParams.set("redirect", targetRedirect)
      }
      if (targetApp) {
        url.searchParams.set("app", targetApp)
      }
      return url.toString()
    },
    [app, redirect]
  )

  const buildProfileUrl = useCallback(
    (path: string, overrides: AuthProfileRedirectOptions = {}) => {
      const url = new URL(buildUrl(path, overrides))
      if (overrides.step) {
        url.searchParams.set("step", overrides.step)
      }
      return url.toString()
    },
    [buildUrl]
  )

  const buildLogoutUrl = useCallback(
    (overrides?: AuthAppRedirectOptions) => buildUrl("/logout", overrides),
    [buildUrl]
  )

  const buildLoginUrl = useCallback(
    (overrides?: AuthAppRedirectOptions) => buildUrl("/", overrides),
    [buildUrl]
  )

  const buildCreateProfileUrl = useCallback(
    (overrides?: AuthProfileRedirectOptions) =>
      buildProfileUrl("/create-profile", overrides),
    [buildProfileUrl]
  )

  const buildSelectProfileUrl = useCallback(
    (overrides?: AuthAppRedirectOptions) =>
      buildUrl("/select-profile", overrides),
    [buildUrl]
  )

  const buildEditProfileUrl = useCallback(
    (overrides?: AuthProfileRedirectOptions) =>
      buildProfileUrl("/edit-profile", overrides),
    [buildProfileUrl]
  )

  const login = useCallback(
    (overrides?: AuthAppRedirectOptions) => {
      if (typeof window === "undefined") {
        return
      }
      window.location.assign(buildLoginUrl(overrides))
    },
    [buildLoginUrl]
  )

  const logout = useCallback(
    (overrides?: AuthAppRedirectOptions) => {
      if (typeof window === "undefined") {
        return
      }
      window.location.assign(buildLogoutUrl(overrides))
    },
    [buildLogoutUrl]
  )

  const redirectToCreateProfile = useCallback(
    (overrides?: AuthProfileRedirectOptions) => {
      if (typeof window === "undefined") {
        return
      }
      window.location.assign(buildCreateProfileUrl(overrides))
    },
    [buildCreateProfileUrl]
  )

  const redirectToSelectProfile = useCallback(
    (overrides?: AuthAppRedirectOptions) => {
      if (typeof window === "undefined") {
        return
      }
      window.location.assign(buildSelectProfileUrl(overrides))
    },
    [buildSelectProfileUrl]
  )

  const redirectToEditProfile = useCallback(
    (overrides?: AuthProfileRedirectOptions) => {
      if (typeof window === "undefined") {
        return
      }
      window.location.assign(buildEditProfileUrl(overrides))
    },
    [buildEditProfileUrl]
  )

  return {
    app,
    login,
    logout,
    selectProfile: redirectToSelectProfile,
    createProfile: redirectToCreateProfile,
    updateProfile: redirectToEditProfile,
  }
}
