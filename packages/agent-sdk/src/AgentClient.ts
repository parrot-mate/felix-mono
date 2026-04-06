import {
  AgentRequest,
  AgentResponse,
  MsgKind,
  MsgOp,
  PipelineOp,
  type Msg as MsgType,
} from "@pmate/meta"
import {
  AsyncStream,
  EmitterV2,
  HashType,
  Logger,
  Msg,
  StreamEvent,
  uniqHash,
  WebsocketClientV2,
  WebsocketEvents,
  type WebsocketStreamEvent,
} from "@pmate/utils"
import { AgentTaskManager } from "./AgentTaskManager"
import { AgentService } from "./AgentService"

const logger = Logger.getDebugger("AgentClient")

const DEFAULT_TIMEOUT_MS = 40_000
const DEFAULT_STREAM_TIMEOUT_MS = 120_000
const DEFAULT_MIN_CHUNK_SIZE_BYTES = 1024 * 1024

type AgentRunRequest = {
  agentId: string
  payload?: Record<string, unknown>
}

export type AgentPromptRequest = {
  agentId: string
  payload?: Record<string, unknown>
}

export type AgentGenerateImageRequest = {
  agentId: string
  payload?: Record<string, unknown>
}

export type AgentEchoRequest = {
  agentId: string
  payload?: Record<string, unknown>
}

export type AgentStreamRequest<TChunk = Blob> = {
  agentId: string
  stream: AsyncStream<TChunk>
  params?: Record<string, unknown>
  minChunkSizeBytes?: number
}

export type AgentClientOptions = {
  baseUrl: string
  timeoutMs?: number
  streamTimeoutMs?: number
  minChunkSizeBytes?: number
}

export type AgentLoginOptions = {
  baseUrl?: string
  token?: string
  timeoutMs?: number
}

export type AgentClientEventMap = {
  [WebsocketEvents.Connecting]: void
  [WebsocketEvents.Connected]: boolean
  [WebsocketEvents.Error]: unknown
}

export class AgentClient extends EmitterV2<AgentClientEventMap> {
  private ws?: WebsocketClientV2
  private from?: string
  private baseUrl: string
  private tasks = new AgentTaskManager()
  private timeoutMs: number
  private streamTimeoutMs: number
  private minChunkSizeBytes: number
  private authPromise: Promise<boolean> | null = null
  private authResolve: ((success: boolean) => void) | null = null
  private authReject: ((reason?: unknown) => void) | null = null
  private authTimer: ReturnType<typeof setTimeout> | null = null
  private wsGeneration = 0
  private defaultRequestType = "application/json"
  private defaultBinaryType = "application/octet-stream"

  constructor(options: AgentClientOptions) {
    super()
    this.baseUrl = options.baseUrl
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
    this.streamTimeoutMs = options.streamTimeoutMs ?? DEFAULT_STREAM_TIMEOUT_MS
    this.minChunkSizeBytes =
      options.minChunkSizeBytes ?? DEFAULT_MIN_CHUNK_SIZE_BYTES
    this.resetWebsocket(this.baseUrl)
  }

  public isConnected() {
    return this.ws?.isConnected() ?? false
  }

  public close() {
    this.ws?.close()
  }

  public async login(from: string, options?: AgentLoginOptions) {
    this.from = from

    const baseUrl = options?.baseUrl ?? this.baseUrl
    if (baseUrl !== this.baseUrl) {
      this.resetWebsocket(baseUrl)
    }

    const timeoutMs = options?.timeoutMs ?? this.timeoutMs
    await this.waitForConnection(timeoutMs)

    const token = options?.token ?? ""
    await this.sendAuth(token, timeoutMs)
    return true
  }

  public async prompt<TFinal = unknown>(request: AgentPromptRequest) {
    return this.runInternal<TFinal>({
      agentId: request.agentId,
      payload: request.payload,
    })
  }

  public async generateImage<TFinal = unknown>(
    request: AgentGenerateImageRequest,
  ) {
    return this.runInternal<TFinal>({
      agentId: request.agentId,
      payload: request.payload,
    })
  }

  public async echo<TFinal = unknown>(request: AgentEchoRequest) {
    return this.runInternal<TFinal>({
      agentId: request.agentId,
      payload: request.payload,
    })
  }

  private async runInternal<TFinal = unknown>(request: AgentRunRequest) {
    this.ensureReady()

    const taskId = this.createTaskId(request.agentId)
    const agent = await AgentService.getAgent(request.agentId)
    const hubTo = `@hub/${agent.type}`
    const { waiter } = this.tasks.createTask<TFinal>(taskId, {
      timeoutMs: this.timeoutMs,
      failMode: "resolve-null",
      onFail: (message) => {
        logger.error("Agent task failed", request.agentId, message)
      },
    })

    const startPayload: AgentRequest = {
      taskId,
      agentId: request.agentId,
      op: PipelineOp.Start,
      type: this.defaultRequestType,
      ...(request.payload ? { payload: request.payload } : {}),
    }

    const msg = Msg.create(
      this.from!,
      hubTo,
      MsgOp.AGENT_REQUEST,
      startPayload,
      MsgKind.PIPELINE,
    )
    await this.ws!.sendMsg(msg)
    return await waiter
  }

  public stream<TFinal = unknown, TChunk = Blob>(
    request: AgentStreamRequest<TChunk>,
  ) {
    this.ensureReady()

    const taskId = this.createTaskId(request.agentId)
    const { waiter, onProgress } = this.tasks.createTask<TFinal>(taskId, {
      timeoutMs: this.streamTimeoutMs,
      failMode: "reject",
      timeoutMode: "resolve-null",
    })

    const from = this.from!
    const ws = this.ws!
    const minChunkSizeBytes = request.minChunkSizeBytes ?? this.minChunkSizeBytes
    const inputStream =
      minChunkSizeBytes > 0
        ? AsyncStream.chunkBlob(request.stream as unknown as AsyncStream<Blob>, {
            minBytes: minChunkSizeBytes,
          })
        : (request.stream as AsyncStream<any>)

    const outputStream = new AsyncStream<StreamEvent<unknown, TFinal>>()
    onProgress((data) => {
      outputStream.push({ type: "progress", data })
    })
    waiter
      .then((finalData) => {
        console.log("[agent-client] stream waiter resolved", {
          taskId,
          finalType:
            finalData == null
              ? "null"
              : finalData instanceof Uint8Array
                ? `uint8array:${finalData.length}`
                : Array.isArray(finalData)
                  ? `array:${finalData.length}`
                  : typeof finalData,
          streamState: outputStream.state,
          queueLength: outputStream.length,
        })
        outputStream.push({ type: "final", data: finalData })
        console.log("[agent-client] pushed final event", {
          taskId,
          streamState: outputStream.state,
          queueLength: outputStream.length,
        })
        outputStream.end()
        console.log("[agent-client] stream.end called", {
          taskId,
          streamState: outputStream.state,
          queueLength: outputStream.length,
        })
      })
      .catch((err) => {
        console.log("[agent-client] stream waiter rejected", {
          taskId,
          error: (err as Error)?.message ?? String(err),
        })
        outputStream.error(err)
      })

    const startDataStream = async () => {
      const agent = await AgentService.getAgent(request.agentId)
      const hubTo = `@hub/${agent.type}`
      const startMsg = Msg.create(
        from,
        hubTo,
        MsgOp.AGENT_REQUEST,
        {
          taskId,
          agentId: request.agentId,
          op: PipelineOp.Start,
          type: this.defaultRequestType,
          ...(request.params ? { payload: request.params } : {}),
        },
        MsgKind.PIPELINE,
      )
      await ws.sendMsg(startMsg)

      for await (const payload of inputStream) {
        const dataType =
          payload instanceof Blob
            ? payload.type || this.defaultBinaryType
            : payload instanceof Uint8Array || payload instanceof ArrayBuffer
              ? this.defaultBinaryType
            : typeof payload === "string"
              ? "text"
              : this.defaultRequestType
        const body: AgentRequest = {
          taskId,
          agentId: request.agentId,
          op: PipelineOp.Data,
          type: dataType,
          payload,
        }
        const msg = Msg.create(
          from,
          hubTo,
          MsgOp.AGENT_REQUEST,
          body,
          MsgKind.PIPELINE,
        )
        await ws.sendMsg(msg)
      }

      const endMsg = Msg.create(
        from,
        hubTo,
        MsgOp.AGENT_REQUEST,
        {
          taskId,
          agentId: request.agentId,
          op: PipelineOp.End,
          type: this.defaultRequestType,
        },
        MsgKind.PIPELINE,
      )
      await ws.sendMsg(endMsg)
    }
    void startDataStream()

    const agentStream = outputStream as AsyncStream<
      StreamEvent<unknown, TFinal>
    > & {
      finish: () => Promise<TFinal | null>
    }
    const waitForClose = () => {
      if (outputStream.state === "closed") {
        console.log("[agent-client] waitForClose immediate closed", { taskId })
        return Promise.resolve()
      }
      console.log("[agent-client] waitForClose subscribe close", {
        taskId,
        streamState: outputStream.state,
        queueLength: outputStream.length,
      })
      return new Promise<void>((resolve) => {
        const off = outputStream.on("close", () => {
          console.log("[agent-client] close event received", {
            taskId,
            streamState: outputStream.state,
            queueLength: outputStream.length,
          })
          off()
          resolve()
        })
      })
    }
    agentStream.finish = async () => {
      console.log("[agent-client] finish called", {
        taskId,
        streamState: outputStream.state,
      })
      const result = await waiter
      console.log("[agent-client] finish waiter done", {
        taskId,
        streamState: outputStream.state,
        queueLength: outputStream.length,
      })
      // If caller only awaits finish() without consuming the stream iterator,
      // force-close so finish() does not hang waiting for "close".
      if (outputStream.state !== "closed" && outputStream.length > 0) {
        try {
          const iterator = outputStream[Symbol.asyncIterator]()
          await iterator.return?.()
        } catch {
          // Ignore: stream may already have an active consumer.
        }
      }
      await waitForClose()
      console.log("[agent-client] finish completed", { taskId })
      return result
    }

    return agentStream
  }

  private ensureReady() {
    if (!this.ws || !this.from) {
      throw new Error("AgentClient not logged in")
    }
  }

  private createTaskId(agentId: string) {
    const rnd = Math.floor(Math.random() * 1_000_000_000_000)
    return uniqHash(`${agentId}-${Date.now()}-${rnd}`, HashType.Task)
  }

  private createWebsocketClient(baseUrl: string) {
    return new WebsocketClientV2(this.ensureProtocol(baseUrl, "wss"))
  }

  private resetWebsocket(baseUrl: string) {
    this.baseUrl = baseUrl
    if (this.ws) {
      this.ws.close()
    }
    this.ws = this.createWebsocketClient(this.baseUrl)
    this.wsGeneration += 1
    this.startWsStream(this.ws, this.wsGeneration)
  }

  private async startWsStream(ws: WebsocketClientV2, generation: number) {
    const stream = ws.getStream()
    try {
      for await (const event of stream) {
        if (generation !== this.wsGeneration) {
          break
        }
        this.handleWsEvent(event)
      }
    } catch {
      // ignore: stream error is surfaced via events
    }
  }

  private handleWsEvent(event: WebsocketStreamEvent) {
    if (event.type === "message") {
      this.handleIncomingMessage(event.data)
      return
    }

    if (event.type === "connecting") {
      this.emit(WebsocketEvents.Connecting)
      return
    }

    if (event.type === "connected") {
      this.emit(WebsocketEvents.Connected, event.data)
      return
    }

    if (event.type === "error") {
      this.emit(WebsocketEvents.Error, event.data)
    }
  }

  private handleIncomingMessage(message: MsgType<any>) {
    if (!message || typeof message !== "object") {
      return
    }

    if (message.opcode === MsgOp.AUTH_ACK) {
      const success = Boolean((message.body as any)?.success)
      this.resolveAuth(success)
      return
    }

    if (message.opcode === MsgOp.AGENT_RESPONSE) {
      const body = message.body as AgentResponse
      console.log("[agent-client] incoming AGENT_RESPONSE", {
        taskId: body?.taskId,
        isFinal: body?.isFinal,
        success: body?.success,
        type: body?.type,
        contentEncoding: body?.contentEncoding,
        payloadKind:
          body?.payload == null
            ? "null"
            : body.payload instanceof Uint8Array
              ? `uint8array:${body.payload.length}`
              : Array.isArray(body.payload)
                ? `array:${body.payload.length}`
                : typeof body.payload,
      })
      this.tasks.handleResponse(message.body as AgentResponse)
    }
  }

  private ensureProtocol(value: string, protocol: "https" | "wss") {
    if (!value) {
      return ""
    }
    if (/^[a-z]+:\/\//i.test(value)) {
      try {
        const url = new URL(value)
        url.protocol = `${protocol}:`
        return url.toString()
      } catch {
        return value
      }
    }
    if (value.startsWith("//")) {
      return `${protocol}:${value}`
    }
    return `${protocol}://${value}`
  }

  private waitForConnection(timeoutMs: number) {
    if (!this.ws) {
      return Promise.reject(new Error("Websocket client not initialized"))
    }
    if (this.ws.isConnected()) {
      return Promise.resolve()
    }

    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        off()
        reject(new Error("Websocket connect timeout"))
      }, timeoutMs)

      const off = this.on(WebsocketEvents.Connected, (connected) => {
        if (connected) {
          clearTimeout(timer)
          off()
          resolve()
        }
      })
    })
  }

  private async sendAuth(token: string, timeoutMs: number) {
    if (!this.ws || !this.from) {
      throw new Error("AgentClient not initialized")
    }

    const msg = Msg.create(this.from, "@hub", MsgOp.AUTH, { token, as: "user" })
    const waiter = this.waitForAuthAck(timeoutMs)
    await this.ws.sendMsg(msg)
    const success = await waiter
    if (!success) {
      throw new Error("Auth failed")
    }
  }

  private waitForAuthAck(timeoutMs: number) {
    if (this.authPromise) {
      return this.authPromise
    }

    this.authPromise = new Promise<boolean>((resolve, reject) => {
      this.authResolve = resolve
      this.authReject = reject
      this.authTimer = setTimeout(() => {
        this.clearAuthWaiter()
        reject(new Error("Auth timeout"))
      }, timeoutMs)
    })

    return this.authPromise
  }

  private resolveAuth(success: boolean) {
    if (!this.authResolve) {
      return
    }
    const resolve = this.authResolve
    this.clearAuthWaiter()
    resolve(success)
  }

  private clearAuthWaiter() {
    if (this.authTimer) {
      clearTimeout(this.authTimer)
      this.authTimer = null
    }
    this.authPromise = null
    this.authResolve = null
    this.authReject = null
  }
}
