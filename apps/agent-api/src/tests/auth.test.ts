import { describe, expect, it, vi } from "vitest"
import { createAuthService } from "../auth"

describe("auth/admin guards", () => {
  it("authenticates valid bearer tokens", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          message: "ok",
          data: {
            identity: { accountId: "acct-admin" },
            issuedAt: new Date(0).toISOString(),
            expiresAt: new Date(60_000).toISOString(),
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    )
    const auth = createAuthService({
      authApiBaseUrl: "http://auth.local",
      adminAccountIds: ["acct-admin"],
      fetchImpl: fetchImpl as any,
    })

    const result = await auth.authenticateRequest(
      new Request("http://local/agents", {
        headers: { authorization: "Bearer token-123" },
      })
    )

    expect(result.accountId).toBe("acct-admin")
    expect(fetchImpl).toHaveBeenCalledOnce()
  })

  it("rejects missing auth headers and enforces admin allowlist", async () => {
    const auth = createAuthService({
      authApiBaseUrl: "http://auth.local",
      adminAccountIds: ["acct-admin"],
      fetchImpl: vi.fn() as any,
    })

    await expect(
      auth.authenticateRequest(new Request("http://local/agents"))
    ).rejects.toThrow(/Missing authorization header/)

    expect(() => auth.requireAdmin("acct-reader")).toThrow(/Forbidden/)
  })

  it("fails closed when no admin allowlist is configured", () => {
    const auth = createAuthService({
      authApiBaseUrl: "http://auth.local",
      adminAccountIds: [],
      fetchImpl: vi.fn() as any,
    })

    expect(() => auth.requireAdmin("acct-admin")).toThrow(/allowlist is not configured/)
  })
})
