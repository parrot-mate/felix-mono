import type { AccountState } from "@pmate/meta"
import { resolveAppId } from "./resolveAppId"

export const ACCOUNT_STATE_KEY = "account-state-v2"

const canUseStorage = () => typeof localStorage !== "undefined"

const buildAccountStateStorageKey = (app?: string): string =>
  `${ACCOUNT_STATE_KEY}:${resolveAppId(app)}`

export const getAccountState = (app?: string): AccountState | null => {
  if (!canUseStorage()) {
    return null
  }
  try {
    const raw = localStorage.getItem(buildAccountStateStorageKey(app))
    if (!raw) {
      return null
    }
    return JSON.parse(raw) as AccountState
  } catch {
    return null
  }
}

export const setAccountState = (state: AccountState, app?: string): void => {
  if (!canUseStorage()) {
    return
  }
  try {
    localStorage.setItem(buildAccountStateStorageKey(app), JSON.stringify(state))
  } catch {
    // ignore write errors
  }
}

export const clearAccountState = (app?: string): void => {
  if (!canUseStorage()) {
    return
  }
  try {
    localStorage.removeItem(buildAccountStateStorageKey(app))
  } catch {
    // ignore delete errors
  }
}
