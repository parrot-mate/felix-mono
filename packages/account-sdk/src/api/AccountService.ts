import {
  AuthLoginResponse,
  AuthRequest,
  AuthSession,
  ServerResponse,
  VCodeIssueRequest,
  VCodeIssueResult,
} from "@pmate/meta"
import { lru } from "@pmate/utils"
import { getAuthToken } from "../utils/tokenStorage"

const AUTH_ENDPOINT = "https://auth-api-v2.pmate.chat"
type AuthRequestInit = RequestInit & { token?: string; app?: string }

export class AccountService {
  private static sessionCached = lru(
    (token?: string, app?: string) =>
      AccountService.authRequest<AuthSession | null>("/session", {
        method: "GET",
        token,
        app,
      }),
    {
      ttl: 3_000,
      key: (token, app) => token ?? getAuthToken(app) ?? `default:${app ?? ""}`,
    }
  )
  public static async vcode(
    payload: VCodeIssueRequest
  ): Promise<VCodeIssueResult> {
    return AccountService.authRequest<VCodeIssueResult>("/vcode", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  public static async login(request: AuthRequest): Promise<AuthLoginResponse> {
    return AccountService.authRequest<AuthLoginResponse>("/login", {
      method: "POST",
      body: JSON.stringify(request),
      token: request.nonce,
      app: request.app,
    })
  }

  public static async logout(token?: string, app?: string) {
    return AccountService.authRequest<{ success: boolean }>("/logout", {
      method: "POST",
      token,
      app,
    })
  }

  public static async session(token?: string, app?: string) {
    return AccountService.sessionCached(token, app)
  }

  public static clearSessionCache() {
    AccountService.sessionCached.clean()
  }

  private static async authRequest<T>(path: string, init: AuthRequestInit) {
    const { token, headers, app, ...rest } = init
    const resolvedToken = token ?? getAuthToken(app)
    const response = await fetch(
      `${AUTH_ENDPOINT.replace(/\/+$/, "")}${path}`,
      {
        credentials: "include",
        ...rest,
        headers: {
          "Content-Type": "application/json",
          ...(resolvedToken
            ? { Authorization: `Bearer ${resolvedToken}` }
            : {}),
          ...(headers ?? {}),
        },
      }
    )
    const json = (await response.json()) as ServerResponse<T>
    if (!response.ok || !json.success) {
      throw json
    }
    return json.data
  }
}
