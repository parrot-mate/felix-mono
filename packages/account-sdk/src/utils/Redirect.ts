const AUTH_APP_BASE = "https://auth.pmate.chat"

export class Redirect {
  static toLogin(app: string, redirect?: string) {
    const url = new URL(AUTH_APP_BASE)
    url.searchParams.set("redirect", redirect ?? window.location.href)
    url.searchParams.set("app", app)
    window.location.href = url.toString()
  }

  static toCreateProfile(app: string, redirect?: string) {
    const url = new URL("/create-profile", AUTH_APP_BASE)
    url.searchParams.set("redirect", redirect ?? window.location.href)
    url.searchParams.set("app", app)
    window.location.href = url.toString()
  }
}
