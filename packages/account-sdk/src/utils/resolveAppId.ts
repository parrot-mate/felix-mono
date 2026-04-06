export const resolveAppId = (fallbackApp?: string) => {
  const envApp = ""
  if (envApp) {
    return envApp
  }
  if (typeof window !== "undefined") {
    const urlApp = new URLSearchParams(window.location.search).get("app")
    if (urlApp) {
      return urlApp
    }
  }
  return fallbackApp || "pmate"
}
