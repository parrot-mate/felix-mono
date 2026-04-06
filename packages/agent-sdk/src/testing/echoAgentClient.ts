import {
  MsgKind,
  MsgOp,
  PING,
  PONG,
  PipelineOp,
  type AgentRequest,
  type AgentResponse,
  type Msg as MsgType,
} from "@pmate/meta"
import { Msg } from "@pmate/utils"
import { gunzipSync } from "zlib"
import WebSocket, { type RawData } from "ws"

type EchoAgentOptions = {
  wsUrl: string
  agentId: string
  token?: string
}

type TaskState = {
  from: string
  startPayload?: unknown
  chunks: Uint8Array[]
  runTimer?: NodeJS.Timeout
}

const RUN_DECISION_DELAY_MS = 80

export class EchoAgentClient {
  private ws: WebSocket | null = null
  private heartbeatTimer: NodeJS.Timeout | null = null
  private readonly tasks = new Map<string, TaskState>()
  private authPromise: Promise<void> | null = null
  private authResolve: (() => void) | null = null
  private authReject: ((error: Error) => void) | null = null
  private readonly requestType = "application/json"
  private readonly binaryType = "application/octet-stream"

  constructor(private readonly options: EchoAgentOptions) {}

  async start() {
    if (this.ws) {
      return
    }

    this.authPromise = new Promise<void>((resolve, reject) => {
      this.authResolve = resolve
      this.authReject = reject
    })

    this.ws = new WebSocket(this.options.wsUrl)
    this.ws.binaryType = "arraybuffer"
    this.ws.on("open", () => {
      void this.sendAuth()
      this.startHeartbeat()
    })
    this.ws.on("message", (data) => {
      void this.handleMessage(data)
    })
    this.ws.on("error", (error) => {
      if (this.authReject) {
        this.authReject(error as Error)
      }
      console.error("[echo-agent] websocket error", error)
    })
    this.ws.on("close", () => {
      this.stopHeartbeat()
      this.ws = null
    })

    await this.authPromise
  }

  stop() {
    this.stopHeartbeat()
    this.ws?.close()
    this.ws = null
    this.clearTaskStates()
  }

  private async sendAuth() {
    const auth = Msg.create(
      this.options.agentId,
      "@hub",
      MsgOp.AUTH,
      {
        token: this.options.token ?? "",
        as: "agent",
        agentId: this.options.agentId,
      } as any,
      MsgKind.PIPELINE
    )
    await this.sendMsg(auth)
  }

  private async handleMessage(raw: RawData) {
    if (Buffer.isBuffer(raw) && raw.length === 1) {
      if (raw[0] === PING) {
        this.ws?.send(Buffer.from([PONG]))
        return
      }
      if (raw[0] === PONG) {
        return
      }
    }

    let msg: MsgType<any>
    try {
      msg = decodeRawMessage(raw)
    } catch (error) {
      console.error("[echo-agent] decode message error", error)
      return
    }

    if (msg.opcode === MsgOp.AUTH_ACK) {
      const ack = (msg.body as { success?: boolean; reason?: string } | null) ?? null
      const success = Boolean(ack?.success)
      if (!success) {
        const reason = ack?.reason ?? "unknown"
        console.error("[echo-agent] auth rejected", {
          agentId: this.options.agentId,
          wsUrl: this.options.wsUrl,
          reason,
          ackBody: ack,
        })
        const error = new Error(`Echo agent auth failed: ${reason}`)
        this.authReject?.(error)
        throw error
      }
      console.log("[echo-agent] auth accepted", {
        agentId: this.options.agentId,
        wsUrl: this.options.wsUrl,
      })
      this.authResolve?.()
      this.authPromise = null
      this.authResolve = null
      this.authReject = null
      return
    }

    if (msg.opcode !== MsgOp.AGENT_REQUEST) {
      return
    }

    await this.handleAgentRequest(msg as MsgType<MsgOp.AGENT_REQUEST>)
  }

  private async handleAgentRequest(msg: MsgType<MsgOp.AGENT_REQUEST>) {
    const req = msg.body as AgentRequest
    const taskId = req.taskId

    try {
      if (req.op === PipelineOp.Start) {
        console.log("[echo-agent] request:start", {
          taskId,
          from: msg.from,
          type: req.type,
          hasPayload: req.payload != null,
        })
        const existing = this.tasks.get(taskId)
        if (existing?.runTimer) {
          clearTimeout(existing.runTimer)
        }

        const state: TaskState = {
          from: msg.from,
          startPayload: req.payload ?? null,
          chunks: [],
        }
        state.runTimer = setTimeout(() => {
          void this.flushRunTask(taskId)
        }, RUN_DECISION_DELAY_MS)
        this.tasks.set(taskId, state)
        return
      }

      if (req.op === PipelineOp.Data) {
        console.log("[echo-agent] request:data", {
          taskId,
          from: msg.from,
          type: req.type,
          contentEncoding: req.contentEncoding,
        })
        const state = this.tasks.get(taskId)
        if (!state) {
          console.log("[echo-agent] request:data ignored missing state", {
            taskId,
          })
          return
        }

        if (state.runTimer) {
          clearTimeout(state.runTimer)
          state.runTimer = undefined
        }

        const bytes = await decodeBinaryPayload(req.payload, req.contentEncoding)
        state.chunks.push(bytes)
        console.log("[echo-agent] request:data accepted", {
          taskId,
          chunkBytes: bytes.length,
          totalChunks: state.chunks.length,
          totalBytes: state.chunks.reduce((sum, chunk) => sum + chunk.length, 0),
        })
        return
      }

      if (req.op === PipelineOp.End) {
        console.log("[echo-agent] request:end", {
          taskId,
          from: msg.from,
        })
        const state = this.tasks.get(taskId)
        if (!state) {
          console.log("[echo-agent] request:end ignored missing state", {
            taskId,
          })
          return
        }
        if (state.runTimer) {
          clearTimeout(state.runTimer)
          state.runTimer = undefined
        }

        const combined = concatBytes(state.chunks)
        console.log("[echo-agent] response:final-binary", {
          taskId,
          chunks: state.chunks.length,
          bytes: combined.length,
        })
        await this.sendResponse(state.from, {
          taskId,
          success: true,
          isFinal: true,
          type: this.binaryType,
          payload: combined,
        })
        this.tasks.delete(taskId)
      }
    } catch (error) {
      await this.sendResponse(msg.from, {
        taskId,
        success: false,
        isFinal: true,
        type: this.requestType,
        payload: null,
        message: (error as Error).message,
      })
      this.tasks.delete(taskId)
    }
  }

  private async flushRunTask(taskId: string) {
    const state = this.tasks.get(taskId)
    if (!state) {
      return
    }
    console.log("[echo-agent] response:final-run", {
      taskId,
      hasPayload: state.startPayload != null,
    })
    await this.sendResponse(state.from, {
      taskId,
      success: true,
      isFinal: true,
      type: this.requestType,
      payload: state.startPayload ?? null,
    })
    this.tasks.delete(taskId)
  }

  private async sendResponse(to: string, body: AgentResponse) {
    console.log("[echo-agent] send response", {
      to,
      taskId: body.taskId,
      success: body.success,
      isFinal: body.isFinal,
      type: body.type,
      contentEncoding: body.contentEncoding,
      payloadKind:
        body.payload == null
          ? "null"
          : body.payload instanceof Uint8Array
            ? `uint8array:${body.payload.length}`
            : Array.isArray(body.payload)
              ? `array:${body.payload.length}`
              : typeof body.payload,
    })
    const msg = Msg.create(
      this.options.agentId,
      to,
      MsgOp.AGENT_RESPONSE,
      body,
      MsgKind.PIPELINE
    )
    await this.sendMsg(msg)
  }

  private async sendMsg(msg: MsgType<any>) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("Echo agent websocket is not connected")
    }
    const payload = await Msg.toWire(msg, "websocket")
    this.ws.send(Buffer.from(payload))
  }

  private startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(Buffer.from([PING]))
      }
    }, 30_000)
  }

  private stopHeartbeat() {
    if (!this.heartbeatTimer) {
      return
    }
    clearInterval(this.heartbeatTimer)
    this.heartbeatTimer = null
  }

  private clearTaskStates() {
    for (const state of this.tasks.values()) {
      if (state.runTimer) {
        clearTimeout(state.runTimer)
      }
    }
    this.tasks.clear()
  }
}

function decodeRawMessage(raw: RawData): MsgType<any> {
  if (typeof raw === "string") {
    return Msg.decodeWire(raw, "websocket")
  }

  if (Array.isArray(raw)) {
    const buffer = Buffer.concat(raw.map((item) => Buffer.from(item)))
    return Msg.decodeWire(buffer, "websocket")
  }

  if (raw instanceof ArrayBuffer) {
    return Msg.decodeWire(raw, "websocket")
  }

  return Msg.decodeWire(new Uint8Array(raw), "websocket")
}

async function decodeBinaryPayload(
  payload: unknown,
  contentEncoding?: string
): Promise<Uint8Array> {
  const encoded = await toBytes(payload)
  if (contentEncoding === "gzip" && encoded.length > 0) {
    return new Uint8Array(gunzipSync(encoded))
  }
  return encoded
}

async function toBytes(payload: unknown): Promise<Uint8Array> {
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

  if (typeof Blob !== "undefined" && payload instanceof Blob) {
    return new Uint8Array(await payload.arrayBuffer())
  }

  if (typeof payload === "string") {
    return new TextEncoder().encode(payload)
  }

  if (Array.isArray(payload) && payload.every((item) => typeof item === "number")) {
    return Uint8Array.from(payload)
  }

  throw new Error("Unsupported binary payload in echo agent")
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
