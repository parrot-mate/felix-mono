import { AuthIdentity, Session, SessionContext } from "../types"
import { unauthorized } from "./errors"
import { KVStore } from "./KVStore"

export class SessionManager {
  static readonly SESSION_COOKIE_NAME = "pmate-session"

  static readonly SESSION_TTL_SECONDS = 3600 * 24 * 14 // 2 weeks

  private static storePromise: Promise<
    Awaited<ReturnType<typeof KVStore.sessionStore>>
  > | null = null

  static async createSession(identity: AuthIdentity): Promise<SessionContext> {
    const issuedAt = new Date().toISOString()
    const expiresAt = new Date(
      Date.now() + SessionManager.SESSION_TTL_SECONDS * 1000
    ).toISOString()

    const session: Session = {
      identity,
      issuedAt,
      expiresAt,
    }

    const token = SessionManager.generateToken()
    const store = await SessionManager.getStore()
    await store.set(token, session, SessionManager.SESSION_TTL_SECONDS)

    return { token, session }
  }

  static getSession(token: string) {
    return SessionManager.withStore((store) => store.get(token))
  }

  static invalidateSession(token: string) {
    return SessionManager.withStore((store) => store.delete(token))
  }

  static async verifyL3Token(token: string | null | undefined) {
    if (!token) {
      throw unauthorized("Missing L3 session")
    }

    const session = await SessionManager.getSession(token)
    if (!session) {
      throw unauthorized("Invalid or expired L3 session")
    }

    return { token, session }
  }

  static async requireSessionFromRequest(request: Request) {
    const authToken = SessionManager.readAuthorizationHeader(
      request.headers.get("authorization")
    )
    const cookieToken = SessionManager.readSessionCookie(
      request.headers.get("cookie")
    )
    const token = authToken ?? cookieToken
    return SessionManager.verifyL3Token(token)
  }

  static readAuthorizationHeader(authHeader: string | null) {
    if (!authHeader) return null

    const trimmed = authHeader.trim()
    if (!trimmed) return null

    const [scheme, ...rest] = trimmed.split(/\s+/)
    if (!scheme || scheme.toLowerCase() !== "bearer") return null

    const token = rest.join(" ").trim()
    return token.length > 0 ? token : null
  }

  static readSessionCookie(cookieHeader: string | null) {
    console.log("Reading session cookie from:", cookieHeader)
    if (!cookieHeader) return null

    for (const cookie of cookieHeader.split(";")) {
      const [rawName, ...rest] = cookie.split("=")
      console.log("Parsing cookie:", rawName, rest)
      if (!rawName || rest.length === 0) continue
      if (rawName.trim().toLowerCase() !== SessionManager.SESSION_COOKIE_NAME)
        continue

      const rawValue = rest.join("=").trim()
      if (!rawValue) continue

      const value = rawValue.replace(/^"|"$/g, "")
      try {
        return decodeURIComponent(value)
      } catch {
        return value
      }
    }

    return null
  }

  private static generateToken() {
    return crypto.randomUUID().replace(/-/g, "")
  }

  private static getStore() {
    if (!SessionManager.storePromise) {
      SessionManager.storePromise = KVStore.sessionStore()
    }
    return SessionManager.storePromise
  }

  private static async withStore<T>(
    fn: (store: Awaited<ReturnType<typeof KVStore.sessionStore>>) => Promise<T>
  ) {
    const store = await SessionManager.getStore()
    return fn(store)
  }
}
