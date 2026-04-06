import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { AsyncStream } from "@pmate/utils"
import { gunzipSync } from "zlib"
import WebSocket from "ws"
import { AgentClient } from "../AgentClient"
import { EchoAgentClient } from "./echoAgentClient"

;(globalThis as any).WebSocket = WebSocket

const wsUrl = process.env.HUB_ENDPOINT || "wss://hub.pmate.chat"
const token = process.env.PMATE_TOKEN || "0mqZUi3-nwE95uhgRsnkqUkyHdDaxKkM"
const echoAgentId = process.env.ECHO_AGENT_LOWLEVEL_ID || "agent:echo-lowlevel"

describe("agent-sdk echo low-level compatibility", () => {
  let echoAgent: EchoAgentClient
  let userClient: AgentClient

  beforeAll(async () => {
    echoAgent = new EchoAgentClient({
      wsUrl,
      token,
      agentId: echoAgentId,
    })
    await echoAgent.start()

    userClient = new AgentClient({
      baseUrl: wsUrl,
      minChunkSizeBytes: 0,
      timeoutMs: 30_000,
      streamTimeoutMs: 30_000,
    })
    await userClient.login(`echo-lowlevel-user-${Date.now()}`, { token })
  }, 40_000)

  afterAll(() => {
    userClient?.close()
    echoAgent?.stop()
  })

  it("keeps protocol compatibility for one-shot and stream", async () => {
    const runPayload = {
      hello: "echo-lowlevel-run",
      ts: Date.now(),
    }
    const runResult = await userClient.echo<typeof runPayload>({
      agentId: echoAgentId,
      payload: runPayload,
    })

    expect(runResult).toEqual(runPayload)

    const input = new AsyncStream<Uint8Array>()
    const stream = userClient.stream<Uint8Array, Uint8Array>({
      agentId: echoAgentId,
      stream: input,
      minChunkSizeBytes: 0,
    })

    const chunks = [
      Buffer.from("hello "),
      Buffer.from("echo "),
      Buffer.from("lowlevel"),
    ]
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
