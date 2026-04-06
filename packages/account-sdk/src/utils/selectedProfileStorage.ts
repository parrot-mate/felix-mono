import { resolveAppId } from "./resolveAppId"

export const SELECTED_PROFILE_KEY = "selected-profile-v2"

const canUseStorage = () => typeof localStorage !== "undefined"

const buildSelectedProfileStorageKey = (app?: string): string =>
  `${SELECTED_PROFILE_KEY}:${resolveAppId(app)}`

export const getSelectedProfileId = (app?: string): string | null => {
  if (!canUseStorage()) {
    return null
  }
  try {
    const raw = localStorage.getItem(buildSelectedProfileStorageKey(app))
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw) as unknown
    return typeof parsed === "string" ? parsed : null
  } catch {
    return null
  }
}

export const setSelectedProfileId = (id: string, app?: string): void => {
  if (!canUseStorage()) {
    return
  }
  try {
    localStorage.setItem(buildSelectedProfileStorageKey(app), JSON.stringify(id))
  } catch {
    // ignore write errors
  }
}

export const clearSelectedProfileId = (app?: string): void => {
  if (!canUseStorage()) {
    return
  }
  try {
    localStorage.removeItem(buildSelectedProfileStorageKey(app))
  } catch {
    // ignore delete errors
  }
}
