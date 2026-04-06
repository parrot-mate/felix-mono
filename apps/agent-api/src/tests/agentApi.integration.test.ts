import { afterEach, describe, expect, it, vi } from "vitest"
import { createAgentUiApiApp } from "../app"
import { AgentRegistryService } from "../agentRegistry"
import { createAuthService } from "../auth"
import {
  InMemoryBlockchain,
  createSessionResponse,
  createValidLlmPayload,
} from "./inMemoryRegistry"

describe("agent-api integration", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("enforces admin guard on write endpoints", async () => {
    const chain = new InMemoryBlockchain()
    const registry = new AgentRegistryService(chain as any)
    const auth = createAuthService({
      adminAccountIds: ["acct-admin"],
      fetchImpl: (async (input: RequestInfo | URL, init?: RequestInit) => {
        const authHeader =
          init?.headers && "Authorization" in (init.headers as Record<string, string>)
            ? (init.headers as Record<string, string>).Authorization
            : ""
        const accountId = authHeader.includes("reader")
          ? "acct-reader"
          : "acct-admin"
        return new Response(JSON.stringify(createSessionResponse(accountId)), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      }) as any,
    })

    const app = createAgentUiApiApp({ registry, auth })
    vi.spyOn(console, "log").mockImplementation(() => {})
    const response = await app.handle(
      new Request("http://local/agents/demo", {
        method: "POST",
        headers: {
          authorization: "Bearer reader-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: "writer",
          payload: createValidLlmPayload(),
        }),
      })
    )

    expect(response.status).toBe(403)
  })
})
