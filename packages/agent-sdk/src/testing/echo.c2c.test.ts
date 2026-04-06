import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { AsyncStream } from "@pmate/utils"
import { gunzipSync } from "zlib"
import WebSocket from "ws"
import { AgentClient } from "../AgentClient"
import { createPromptAgent, createStreamAgent, type AgentLifecycle } from "../AgentFactory"

;(globalThis as any).WebSocket = WebSocket

const wsUrl = process.env.HUB_ENDPOINT || "wss://hub.pmate.chat"
const token = process.env.PMATE_TOKEN || "0mqZUi3-nwE95uhgRsnkqUkyHdDaxKkM"
const echoAgentId = process.env.ECHO_AGENT_ID || "agent:echo"

describe("agent-sdk echo c2c", () => {
  let promptAgent: AgentLifecycle
  let streamAgent: AgentLifecycle
  let userClient: AgentClient

  beforeAll(async () => {
    promptAgent = createPromptAgent({
      wsUrl,
      token,
      id: echoAgentId,
      async onPrompt(ctx) {
        return ctx.task.payload ?? null
      },
    })
    await promptAgent.start()

    userClient = new AgentClient({
      baseUrl: wsUrl,
      minChunkSizeBytes: 0,
      timeoutMs: 30_000,
      streamTimeoutMs: 30_000,
    })
    await userClient.login(`echo-test-user-${Date.now()}`, { token })
  }, 40_000)

  afterAll(() => {
    userClient?.close()
    promptAgent?.stop()
    streamAgent?.stop()
  })

  it("supports echo with request/response", async () => {
    const runPayload = {
      hello: "echo-run",
      ts: Date.now(),
    }
    const runResult = await userClient.echo<typeof runPayload>({
      agentId: "agent:echo",
      payload: runPayload,
    })

    expect(runResult).toEqual(runPayload)
  }, 40_000)

  it("supports stream with multiple buffers and combined response", async () => {
    promptAgent.stop()

    streamAgent = createStreamAgent({
      wsUrl,
      token,
      id: "agent:echo-stream",
      async onStream(_task, ctx) {
        const chunks: Uint8Array[] = []
        for await (const chunk of ctx.input.bytes()) {
          chunks.push(chunk)
        }
        return concatBytes(chunks)
      },
    })
    await streamAgent.start()

    const input = new AsyncStream<Uint8Array>()
    const stream = userClient.stream<Uint8Array, Uint8Array>({
      agentId: "agent:echo-stream",
      stream: input,
      minChunkSizeBytes: 0,
    })

    const chunks = [Buffer.from("hello "), Buffer.from("echo "), Buffer.from("stream")]
    for (const chunk of chunks) {
      input.push(new Uint8Array(chunk))
    }
    input.end()

    const streamResult = await stream.finish()
    expect(streamResult).not.toBeNull()
    const finalBytes = normalizeAgentResultToBytes(streamResult)
    const expected = Buffer.concat(chunks)
    expect(Buffer.compare(Buffer.from(finalBytes), expected)).toBe(0)
  }, 40_000)
})

function normalizeAgentResultToBytes(payload: unknown): Uint8Array {
  const bytes = toBytes(payload)
  if (!bytes.length) {
    return bytes
  }

  try {
    return new Uint8Array(gunzipSync(bytes))
  } catch {
    return bytes
  }
}

function toBytes(payload: unknown): Uint8Array {
  if (payload == null) {
    return new Uint8Array()
  }
  if (payload instanceof Uint8Array) {
    return payload
  }
  if (ArrayBuffer.isView(payload)) {
    return new Uint8Array(payload.buffer, payload.byteOffset, payload.byteLength)
  }
  if (payload instanceof ArrayBuffer) {
    return new Uint8Array(payload)
  }
  if (Array.isArray(payload) && payload.every((item) => typeof item === "number")) {
    return Uint8Array.from(payload)
  }
  throw new Error("Unexpected stream payload type from echo agent")
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0)
  const merged = new Uint8Array(total)
  let offset = 0
  for (const part of parts) {
    merged.set(part, offset)
    offset += part.length
  }
  return merged
}
