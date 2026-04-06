import { resolveAppId } from "./resolveAppId"

export const TOKEN_STORAGE_KEY = "pmate-auth-token"

const canUseStorage = () => typeof localStorage !== "undefined"

const buildTokenStorageKey = (app?: string): string => {
  return `${TOKEN_STORAGE_KEY}:${resolveAppId(app)}`
}

export const getAuthToken = (app?: string): string | null => {
  if (!canUseStorage()) {
    return null
  }
  try {
    const raw = localStorage.getItem(buildTokenStorageKey(app))
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw) as unknown
    return typeof parsed === "string" ? parsed : null
  } catch {
    return null
  }
}

export const setAuthToken = (token: string, app?: string): void => {
  if (!canUseStorage()) {
    return
  }
  try {
    localStorage.setItem(buildTokenStorageKey(app), JSON.stringify(token))
  } catch {
    // ignore write errors
  }
}

export const clearAuthToken = (app?: string): void => {
  if (!canUseStorage()) {
    return
  }
  try {
    localStorage.removeItem(buildTokenStorageKey(app))
  } catch {
    // ignore delete errors
  }
}
