import type { Msg as MsgType } from "@pmate/meta"
import { PONG /*, PING*/ } from "@pmate/meta"
import { AsyncStream } from "../AsyncStream"
import { Logger } from "../Logger"
import { Msg } from "../Msg"
import { WebsocketHeartbeat } from "./WebsocketHeartbeat"
import type { RealtimeTransportKind } from "./WebsocketClient"

const logger = Logger.getDebugger("message")

export type WebsocketStreamEvent =
  | { type: "connecting" }
  | { type: "connected"; data: boolean }
  | { type: "error"; data: unknown }
  | { type: "message"; data: MsgType<any> }

export class WebsocketClientV2 {
  protected ws!: WebSocket
  protected from?: string
  protected connected = false
  protected wsUrl: string

  private manualClose = false
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined
  private reconnectAttempts = 0
  private readonly maxBackoffMs = 30_000

  private heartBeat: WebsocketHeartbeat
  private stream: AsyncStream<WebsocketStreamEvent>
  private endStreamOnClose = false

  constructor(wsUrl: string, from?: string) {
    this.wsUrl = wsUrl
    this.from = from

    this.stream = new AsyncStream<WebsocketStreamEvent>()

    // Create heartbeat first, but DO NOT bind a socket yet.
    this.heartBeat = new WebsocketHeartbeat({
      from: this.from,
      // Prefer passing a getter or exposing an attach() on heartbeat.
      getWs: () => this.ws,
      onTimeout: () => this.handleHeartbeatTimeout(),
    })

    this.init()
  }

  public getStream() {
    return this.stream
  }

  public isConnected() {
    return this.connected
  }

  private emitEvent(event: WebsocketStreamEvent) {
    if (this.stream.state === "closed") {
      return
    }
    try {
      this.stream.push(event)
    } catch (error) {
      logger.error("Failed to push websocket stream event", error)
    }
  }

  private emitConnect() {
    this.emitEvent({ type: "connected", data: this.connected })
  }

  private init() {
    // Guard against duplicate connections
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return
    }

    this.connected = false
    this.emitEvent({ type: "connecting" })
    this.ws = new WebSocket(this.wsUrl)
    this.ws.binaryType = "arraybuffer" // ensure ArrayBuffer for binary control frames
    this.manualClose = false

    this.ws.onopen = () => {
      this.connected = true
      this.reconnectAttempts = 0
      // If your heartbeat needs explicit attach, do: this.heartBeat.attach(this.ws)
      this.heartBeat.start()
      this.emitConnect()
    }

    this.ws.onmessage = (event: MessageEvent) => {
      const data = event.data
      if (typeof data === "string") {
        this.handleTextMessage(data)
      } else if (data instanceof ArrayBuffer) {
        this.handleBinaryMessage(data)
      } else if ((globalThis as any).Blob && data instanceof Blob) {
        // Safari default is Blob
        data
          .arrayBuffer()
          .then((ab) => this.handleBinaryMessage(ab))
          .catch((e) => logger.log("blob read error", e))
      } else {
        logger.log("Unknown message type", typeof data)
      }
    }

    const onDead = (event?: unknown) => {
      this.connected = false
      this.emitConnect()
      this.heartBeat.stop()
      if (this.manualClose && this.endStreamOnClose) {
        this.endStreamOnClose = false
        this.stream.end()
      }
      if (!this.manualClose) {
        if (isCloseEvent(event)) {
          logger.error(
            "Websocket connection closed unexpectedly",
            this.getDebugContext({
              code: event.code,
              reason: event.reason,
              wasClean: event.wasClean,
            }),
            event
          )
        } else if (isEventLike(event)) {
          logger.error(
            "Websocket connection closed due to event",
            this.getDebugContext({ eventType: event.type }),
            event
          )
        } else {
          logger.error(
            "Websocket connection closed unexpectedly",
            this.getDebugContext()
          )
        }
        this.emitEvent({
          type: "error",
          data: event ?? { type: "websocket-close" },
        })
      }
      this.scheduleReconnect()
    }

    this.ws.onclose = onDead
    this.ws.onerror = (err) => {
      logger.error(
        "Websocket error event fired",
        this.getDebugContext({ eventType: err?.type }),
        err
      )
      onDead(err)
    }
  }

  private handleTextMessage(text: string) {
    try {
      const message = Msg.decodeWire(text, "websocket")
      this.emitEvent({ type: "message", data: message })
    } catch (error) {
      logger.error(
        "Invalid JSON message received",
        this.getDebugContext({
          preview: text.slice(0, 100),
          length: text.length,
        }),
        error
      )
    }
  }

  private handleBinaryMessage(ab: ArrayBuffer) {
    const view = new Uint8Array(ab)
    if (view.length === 0) return

    if (view.length === 1 && view[0] === PONG) {
      this.heartBeat.handlePong()
      return
    }

    try {
      const message = Msg.decodeWire(view, "websocket")
      this.emitEvent({ type: "message", data: message })
    } catch (error) {
      logger.error(
        "Invalid MessagePack message received",
        this.getDebugContext({
          preview: this.getBinaryPreview(view),
          length: view.length,
        }),
        error
      )
    }
  }

  private scheduleReconnect() {
    if (this.manualClose) return
    if (this.reconnectTimer) return
    const base = Math.min(1000 * 2 ** this.reconnectAttempts, this.maxBackoffMs)
    const jitter = Math.floor(Math.random() * 250)
    const delay = base + jitter
    this.reconnectTimer = globalThis.setTimeout(() => {
      if (this.ws && this.ws.readyState === WebSocket.CONNECTING) return

      this.reconnectTimer = undefined
      this.reconnectAttempts++
      logger.log("Reconnecting... attempt", this.reconnectAttempts)
      this.init()
    }, delay)
  }

  private handleHeartbeatTimeout() {
    // Treat as a dead connection: close transport but allow reconnect.
    this.close(false) // not a manual close -> keep reconnecting
  }

  public close(manual = true) {
    this.manualClose = manual

    // Stop all timers first
    this.heartBeat.stop()

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = undefined
    }

    if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
      if (manual) {
        this.connected = false
        this.emitConnect()
        this.stream.end()
      }
      return
    }

    try {
      // Close regardless of state (OPEN/CONNECTING/CLOSING)
      if (manual) {
        this.endStreamOnClose = true
      }
      this.ws?.close()
      // @ts-ignore
      this.ws = undefined
    } catch {
      if (manual) {
        this.connected = false
        this.emitConnect()
        this.stream.end()
      }
    }
  }

  public async sendMsg(msg: MsgType<any>) {
    const ws = this.ws
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      const error = new Error("Websocket is not connected")
      logger.error(
        "Failed to send message: socket not open",
        this.getDebugContext(),
        error
      )
      throw error
    }

    try {
      const payload = await Msg.toWire(msg, "websocket")
      logger.log("send msg", msg)
      ws.send(payload)
    } catch (error) {
      logger.error("Failed to send message", this.getDebugContext(), error)
      throw error
    }
  }

  public getConnectionType(): RealtimeTransportKind {
    return "websocket"
  }

  public getWs() {
    return this.ws
  }

  protected getDebugContext(
    additional?: Record<string, unknown>
  ): Record<string, unknown> {
    return {
      url: this.wsUrl,
      from: this.from,
      connected: this.connected,
      manualClose: this.manualClose,
      reconnectAttempts: this.reconnectAttempts,
      readyState: this.ws?.readyState,
      ...additional,
    }
  }

  private getBinaryPreview(bytes: Uint8Array): string {
    return Array.from(bytes.slice(0, 16))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join(" ")
  }
}

function isEventLike(value: unknown): value is { type: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    typeof (value as { type?: unknown }).type === "string"
  )
}

function isCloseEvent(
  value: unknown
): value is { type: string; code: number; reason: string; wasClean: boolean } {
  return (
    isEventLike(value) &&
    "code" in value &&
    "reason" in value &&
    "wasClean" in value &&
    typeof (value as { code?: unknown }).code === "number" &&
    typeof (value as { reason?: unknown }).reason === "string" &&
    typeof (value as { wasClean?: unknown }).wasClean === "boolean"
  )
}
