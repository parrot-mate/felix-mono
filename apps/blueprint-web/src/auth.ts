export const BLUEPRINT_APP_ID = "@felix/blueprint"
const TOKEN_STORAGE_KEY = "pmate-auth-token"

function getStorage() {
  if (typeof window === "undefined") {
    return null
  }

  try {
    return window.localStorage
  } catch {
    return null
  }
}

function buildTokenStorageKey(appId = BLUEPRINT_APP_ID) {
  return `${TOKEN_STORAGE_KEY}:${appId}`
}

export function getBlueprintAuthToken() {
  const storage = getStorage()
  if (!storage) {
    return null
  }

  try {
    const raw = storage.getItem(buildTokenStorageKey())
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as unknown
    return typeof parsed === "string" ? parsed : null
  } catch {
    return null
  }
}
