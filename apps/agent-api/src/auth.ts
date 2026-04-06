import { BizErrorCode, type AuthSession, type ServerResponse } from "@pmate/meta"
import { ServiceError } from "@pmate/service-core"
import { AGENT_API_ADMIN_ACCOUNT_IDS } from "./allowlist"

export type AuthenticatedAccount = {
  token: string
  accountId: string
  session: AuthSession
}

export type AuthService = {
  authenticateRequest(request: Request): Promise<AuthenticatedAccount>
  requireAdmin(accountId: string): void
}

export function createAuthService(options: {
  authApiBaseUrl?: string
  adminAccountIds?: string[]
  fetchImpl?: typeof fetch
} = {}): AuthService {
  const authApiBaseUrl = (
    options.authApiBaseUrl ||
    process.env.AUTH_API_BASE_URL ||
    "https://auth-api-v2.pmate.chat"
  ).replace(/\/+$/, "")
  const fetchImpl = options.fetchImpl ?? fetch
  const adminAccountIds = new Set(
    (options.adminAccountIds ?? AGENT_API_ADMIN_ACCOUNT_IDS)
      .map((item) => item.trim())
      .filter(Boolean)
  )

  return {
    async authenticateRequest(request: Request): Promise<AuthenticatedAccount> {
      const token = extractBearerToken(request.headers.get("authorization"))
      const response = await fetchImpl(`${authApiBaseUrl}/session`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      let body: ServerResponse<AuthSession | null> | null = null
      try {
        body = (await response.json()) as ServerResponse<AuthSession | null>
      } catch {
        body = null
      }

      if (!response.ok || !body?.success || !body.data?.identity?.accountId) {
        throw new ServiceError("Unauthorized", 401, BizErrorCode.AUTH_ERROR)
      }

      return {
        token,
        accountId: body.data.identity.accountId,
        session: body.data,
      }
    },
    requireAdmin(accountId: string) {
      if (adminAccountIds.size === 0) {
        throw new ServiceError(
          "Agent admin allowlist is not configured",
          503,
          BizErrorCode.AUTH_ERROR
        )
      }
      if (!adminAccountIds.has(accountId)) {
        throw new ServiceError("Forbidden", 403, BizErrorCode.AUTH_ERROR)
      }
    },
  }
}

const defaultAuthService = createAuthService()

export const authenticateRequest = defaultAuthService.authenticateRequest
export const requireAdmin = defaultAuthService.requireAdmin

function extractBearerToken(header: string | null) {
  if (!header) {
    throw new ServiceError("Missing authorization header", 401, BizErrorCode.AUTH_ERROR)
  }
  const match = header.match(/^Bearer\s+(.+)$/i)
  if (!match) {
    throw new ServiceError("Invalid authorization header", 401, BizErrorCode.AUTH_ERROR)
  }
  return match[1].trim()
}
