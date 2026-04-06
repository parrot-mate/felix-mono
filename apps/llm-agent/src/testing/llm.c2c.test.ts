import {
  AgentClient,
  type AgentLifecycle,
} from "@pmate/agent-sdk"
import { config } from "dotenv"
import path from "path"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import WebSocket from "ws"
import type { LlmOutput } from "../types"
;(globalThis as any).WebSocket = WebSocket

config({
  path: [".env.local", ".env"].map((file) =>
    path.resolve(__dirname, `../../${file}`),
  ),
})

const wsUrl = process.env.HUB_ENDPOINT || "wss://hub.pmate.chat"
const token = process.env.PMATE_TOKEN || "0mqZUi3-nwE95uhgRsnkqUkyHdDaxKkM"
const useRemote = process.env.REMOTE === "1"
const promptAgentId = "agent:summary"
const jsonPromptAgentId = "agent:summary-json"

describe("llm-agent c2c", () => {
  let client: AgentClient
  let agent: AgentLifecycle

  beforeAll(async () => {
    process.env.HUB_ENDPOINT = wsUrl
    if (!useRemote) {
      process.env.AGENT_SERVER_ID = "llm-01"

      const { createLlmPromptAgent } = await import("../runtime.js")
      agent = createLlmPromptAgent({
        wsUrl,
        token,
        heartbeatIntervalMs: Number(process.env.HEARTBEAT_INTERVAL_MS || 30_000),
      })
      agent.on("connected", () => {
        console.log("[llm-c2c] agent connected", { agentId: "llm-01" })
      })
      agent.on("task:start", (evt) => {
        console.log("[llm-c2c] agent task:start", evt)
      })
      agent.on("task:end", (evt) => {
        console.log("[llm-c2c] agent task:end", evt)
      })
      agent.on("error", (err) => {
        console.log("[llm-c2c] agent error", (err as any)?.message ?? String(err))
      })
    } else {
      console.log("[llm-c2c] remote mode enabled, skip local agent startup")
    }

    client = new AgentClient({
      baseUrl: wsUrl,
      timeoutMs: 60_000,
      streamTimeoutMs: 60_000,
      minChunkSizeBytes: 0,
    })

    if (!useRemote) {
      await agent.start()
    }
    await client.login(`llm-c2c-user-${Date.now()}`, { token })
  }, 80_000)

  afterAll(() => {
    client?.close()
    agent?.stop()
  })

  it(
    "supports prompt end-to-end",
    async () => {
      const result = await client.prompt<LlmOutput>({
        agentId: promptAgentId,
        payload: {
          text: "TypeScript improves developer productivity with static typing and tooling.",
          language: "English",
        },
      })
      console.log("[llm-c2c] prompt result", result)

      expect(result).not.toBeNull()
      if (!result) {
        return
      }
      expect(["text", "json"]).toContain(result.type)
      if (result.type === "text") {
        expect(typeof result.content).toBe("string")
        expect(String(result.content).trim().length).toBeGreaterThan(0)
      } else {
        expect(result.content).not.toBeNull()
      }
    },
    80_000,
  )

  it(
    "supports json prompt end-to-end",
    async () => {
      const result = await client.prompt<LlmOutput>({
        agentId: jsonPromptAgentId,
        payload: {
          text: "TypeScript improves developer productivity with static typing and tooling.",
          language: "English",
        },
      })
      console.log("[llm-c2c] prompt json result", result)

      expect(result).not.toBeNull()
      if (!result) {
        return
      }
      expect(result.type).toBe("json")
      expect(result.content).not.toBeNull()
      expect(typeof result.content).toBe("object")
    },
    80_000,
  )
})
