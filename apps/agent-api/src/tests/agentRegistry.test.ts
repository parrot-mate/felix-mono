import { describe, expect, it } from "vitest"
import { AgentRegistryService } from "../agentRegistry"
import { InMemoryBlockchain, createValidLlmPayload } from "./inMemoryRegistry"

describe("AgentRegistryService", () => {
  it("creates namespace metadata, stores agents, and appends audit logs", async () => {
    const chain = new InMemoryBlockchain()
    const service = new AgentRegistryService(chain as any)

    const created = await service.createAgent(
      "demo",
      {
        name: "writer",
        payload: createValidLlmPayload(),
        tags: ["llm", "summary"],
      },
      "acct-admin",
      "req-1"
    )

    expect(created.id).toBe("demo:writer")
    expect(created.namespace).toBe("demo")
    expect(created.payload.id).toBe("demo:writer")
    expect(created.version).toBe(1)

    const namespaces = await service.listNamespaces()
    expect(namespaces).toHaveLength(1)
    expect(namespaces[0]?.namespace).toBe("demo")

    const list = await service.listAgents("demo")
    expect(list).toHaveLength(1)
    expect(chain.logs).toHaveLength(1)
    expect(chain.logs[0]?.topic).toBe("@pmate/agent-audit")
  })

  it("updates and disables agents with version bumps", async () => {
    const chain = new InMemoryBlockchain()
    const service = new AgentRegistryService(chain as any)

    await service.createAgent(
      "demo",
      {
        name: "writer",
        payload: createValidLlmPayload(),
      },
      "acct-admin"
    )

    const updated = await service.updateAgent(
      "demo",
      "writer",
      {
        description: "updated",
        version: 1,
      },
      "acct-admin"
    )
    expect(updated.version).toBe(2)
    expect(updated.description).toBe("updated")

    const disabled = await service.disableAgent("demo", "writer", "acct-admin")
    expect(disabled.status).toBe("disabled")
    expect(disabled.version).toBe(3)
  })

  it("rejects invalid namespaces and duplicate ids", async () => {
    const chain = new InMemoryBlockchain()
    const service = new AgentRegistryService(chain as any)

    await expect(
      service.createAgent(
        "Invalid Namespace",
        {
          name: "writer",
          payload: createValidLlmPayload(),
        },
        "acct-admin"
      )
    ).rejects.toThrow(/Invalid namespace/)

    await service.createAgent(
      "demo",
      {
        name: "writer",
        payload: createValidLlmPayload(),
      },
      "acct-admin"
    )

    await expect(
      service.createAgent(
        "demo",
        {
          name: "writer",
          payload: createValidLlmPayload(),
        },
        "acct-admin"
      )
    ).rejects.toThrow(/already exists/)
  })
})
