import { MsgKind, MsgOp, type AgentRequest, type AgentResponse, type Msg as MsgType } from "@pmate/meta"
import { EmitterV2, Msg, WebsocketClientV2, type WebsocketStreamEvent } from "@pmate/utils"
import type {
  AgentEventMap,
  AgentFactoryBaseOptions,
  AgentFailOptions,
  AgentFinalOptions,
  AgentProgressOptions,
  TaskStateBase,
} from "./AgentTypes"

const DEFAULT_REQUEST_TYPE = "application/json"

export class AgentRuntime extends EmitterV2<AgentEventMap> {
  private wsClient: WebsocketClientV2 | null = null
  private authPromise: Promise<void> | null = null
  private authResolve: (() => void) | null = null
  private authReject: ((error: Error) => void) | null = null
  private running = false
  private requestHandler?: (msg: MsgType<MsgOp.AGENT_REQUEST>) => Promise<void>

  constructor(private readonly options: AgentFactoryBaseOptions) {
    super()
  }

  public setRequestHandler(handler: (msg: MsgType<MsgOp.AGENT_REQUEST>) => Promise<void>) {
    this.requestHandler = handler
  }

  public isRunning() {
    return this.running
  }

  public async start() {
    if (this.running) {
      return
    }

    this.authPromise = new Promise<void>((resolve, reject) => {
      this.authResolve = resolve
      this.authReject = reject
    })

    const client = new WebsocketClientV2(this.options.wsUrl, this.options.id)
    this.wsClient = client
    void this.consumeEvents(client)
    await this.authPromise
  }

  public stop() {
    if (!this.wsClient && !this.running) {
      return
    }
    this.rejectAuth(new Error("agent runtime stopped before auth ack"))
    this.running = false
    this.wsClient?.close()
    this.wsClient = null
  }

  public async sendProgress(
    state: TaskStateBase,
    payload: unknown,
    options?: AgentProgressOptions,
  ) {
    if (state.finalized) {
      return
    }
    await this.sendResponse(state.from, {
      taskId: state.taskId,
      success: true,
      isFinal: false,
      type: options?.type ?? inferPayloadType(payload),
      ...(options?.contentEncoding ? { contentEncoding: options.contentEncoding } : {}),
      payload,
    })
  }

  public async sendFinal(state: TaskStateBase, payload: unknown, options?: AgentFinalOptions) {
    if (state.finalized) {
      return
    }
    state.finalized = true
    await this.sendResponse(state.from, {
      taskId: state.taskId,
      success: true,
      isFinal: true,
      type: options?.type ?? inferPayloadType(payload),
      ...(options?.contentEncoding ? { contentEncoding: options.contentEncoding } : {}),
      payload,
    })
  }

  public async sendFail(
    state: TaskStateBase,
    message: string,
    options?: AgentFailOptions,
  ) {
    if (state.finalized) {
      return
    }
    state.finalized = true
    await this.sendResponse(state.from, {
      taskId: state.taskId,
      success: false,
      isFinal: true,
      type: options?.type ?? DEFAULT_REQUEST_TYPE,
      payload: null,
      message,
    })
  }

  public async sendUnsupportedMode(
    msg: MsgType<MsgOp.AGENT_REQUEST>,
    mode: "prompt" | "stream",
  ) {
    const req = msg.body as AgentRequest
    await this.sendResponse(msg.from, {
      taskId: req.taskId,
      success: false,
      isFinal: true,
      type: DEFAULT_REQUEST_TYPE,
      payload: null,
      message:
        mode === "prompt"
          ? "Prompt agent only supports PipelineOp.Start"
          : "Stream agent requires PipelineOp.Start before data",
    })
  }

  private async onSocketMessage(msg: MsgType<any>) {
    try {
      if (msg.opcode === MsgOp.AUTH_ACK) {
        this.handleAuthAck(msg)
        return
      }

      if (msg.opcode !== MsgOp.AGENT_REQUEST) {
        return
      }

      await this.requestHandler?.(msg as MsgType<MsgOp.AGENT_REQUEST>)
    } catch (error) {
      this.emit("error", error)
    }
  }

  private handleAuthAck(msg: MsgType<any>) {
    const ack = (msg.body as { success?: boolean; reason?: string } | null) ?? null
    const success = Boolean(ack?.success)
    if (!success) {
      const error = new Error(ack?.reason ?? "auth failed")
      this.rejectAuth(error)
      this.emit("error", error)
      return
    }

    this.authResolve?.()
    this.authPromise = null
    this.authResolve = null
    this.authReject = null
  }

  private async sendAuth() {
    const auth = Msg.create(
      this.options.id,
      "@hub",
      MsgOp.AUTH,
      {
        token: this.options.token,
        as: "agent",
        agentId: "",
      } as any,
      MsgKind.PIPELINE,
    )
    await this.sendMsg(auth)
  }

  private async sendResponse(to: string, body: AgentResponse) {
    const msg = Msg.create(
      this.options.id,
      to,
      MsgOp.AGENT_RESPONSE,
      body,
      MsgKind.PIPELINE,
    )
    await this.sendMsg(msg)
  }

  private async sendMsg(msg: MsgType<any>) {
    if (!this.wsClient?.isConnected()) {
      throw new Error("Agent websocket is not connected")
    }
    await this.wsClient.sendMsg(msg)
  }

  private async consumeEvents(client: WebsocketClientV2) {
    try {
      for await (const event of client.getStream()) {
        await this.onClientEvent(event)
      }
    } catch (error) {
      this.emit("error", error)
      this.rejectAuth(error as Error)
    }
  }

  private async onClientEvent(event: WebsocketStreamEvent) {
    if (event.type === "connected") {
      if (event.data) {
        this.running = true
        this.emit("connected")
        await this.sendAuth()
      } else if (this.running) {
        this.running = false
        this.emit("disconnected")
        this.rejectAuth(new Error("agent websocket disconnected before auth ack"))
      }
      return
    }

    if (event.type === "error") {
      this.emit("error", event.data)
      this.rejectAuth(new Error("Agent websocket error"))
      return
    }

    if (event.type === "message") {
      await this.onSocketMessage(event.data)
    }
  }

  private rejectAuth(error: Error) {
    if (!this.authPromise) {
      return
    }
    this.authReject?.(error)
    this.authPromise = null
    this.authResolve = null
    this.authReject = null
  }
}

function inferPayloadType(payload: unknown) {
  if (
    payload instanceof Uint8Array ||
    payload instanceof ArrayBuffer ||
    ArrayBuffer.isView(payload)
  ) {
    return "application/octet-stream"
  }
  if (typeof Blob !== "undefined" && payload instanceof Blob) {
    return payload.type || "application/octet-stream"
  }
  return DEFAULT_REQUEST_TYPE
}
