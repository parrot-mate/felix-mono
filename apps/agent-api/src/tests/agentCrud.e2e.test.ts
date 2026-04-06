import { describe, expect, it } from "vitest"
import { createAgentUiApiApp } from "../app"
import { AgentRegistryService } from "../agentRegistry"
import { createAuthService } from "../auth"
import {
  InMemoryBlockchain,
  createSessionResponse,
  createValidLlmPayload,
} from "./inMemoryRegistry"

describe("authenticated CRUD flow", () => {
  it("creates, reads, updates, lists, and disables agents", async () => {
    const chain = new InMemoryBlockchain()
    const registry = new AgentRegistryService(chain as any)
    const auth = createAuthService({
      adminAccountIds: ["acct-admin"],
      fetchImpl: (async () =>
        new Response(JSON.stringify(createSessionResponse("acct-admin")), {
          status: 200,
          headers: { "content-type": "application/json" },
        })) as any,
    })
    const app = createAgentUiApiApp({ registry, auth })

    const createResponse = await app.handle(
      new Request("http://local/agents/demo", {
        method: "POST",
        headers: {
          authorization: "Bearer admin-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: "writer",
          payload: createValidLlmPayload(),
        }),
      })
    )
    expect(createResponse.status).toBe(200)

    const getResponse = await app.handle(
      new Request("http://local/agents/demo/writer", {
        headers: { authorization: "Bearer admin-token" },
      })
    )
    const getJson = await getResponse.json()
    expect(getJson.data.id).toBe("demo:writer")

    const updateResponse = await app.handle(
      new Request("http://local/agents/demo/writer", {
        method: "PUT",
        headers: {
          authorization: "Bearer admin-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          description: "updated",
          version: 1,
        }),
      })
    )
    expect(updateResponse.status).toBe(200)

    const listResponse = await app.handle(
      new Request("http://local/agents?namespace=demo", {
        headers: { authorization: "Bearer admin-token" },
      })
    )
    const listJson = await listResponse.json()
    expect(listJson.data.items).toHaveLength(1)

    const namespacesResponse = await app.handle(
      new Request("http://local/agents/namespaces", {
        headers: { authorization: "Bearer admin-token" },
      })
    )
    const namespacesJson = await namespacesResponse.json()
    expect(namespacesResponse.status).toBe(200)
    expect(namespacesJson.data.items).toHaveLength(1)
    expect(namespacesJson.data.items[0]?.namespace).toBe("demo")

    const deleteResponse = await app.handle(
      new Request("http://local/agents/demo/writer", {
        method: "DELETE",
        headers: { authorization: "Bearer admin-token" },
      })
    )
    const deleteJson = await deleteResponse.json()
    expect(deleteJson.data.status).toBe("disabled")
  })
})
