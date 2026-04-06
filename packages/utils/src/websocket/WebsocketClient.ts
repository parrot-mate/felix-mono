import type { Msg as MsgType } from "@pmate/meta"
import { PONG /*, PING*/ } from "@pmate/meta"
import type { EmitterMessage } from "../Emitter"
import { Emitter } from "../Emitter"
import { Logger } from "../Logger"
import { Msg } from "../Msg"
import { WebsocketHeartbeat } from "./WebsocketHeartbeat"

const logger = Logger.getDebugger("message")

export type RealtimeTransportKind = "websocket" | "h3"

export enum RealtimeEvents {
  Connecting = "connecting",
  Connected = "connected", // true/false
  Error = "error",
  Message = "message",
}

export { RealtimeEvents as WebsocketEvents }

export interface RealtimeClient {
  on<T>(topic: RealtimeEvents, handler: (value: T) => void): () => void
  onAll(
    handler: (message: EmitterMessage<RealtimeEvents, any>) => void
  ): () => void
  isConnected(): boolean
  close(manual?: boolean): void
  sendMsg(msg: MsgType<any>): Promise<void>
  getConnectionType(): RealtimeTransportKind
}

export class WebsocketClient
  extends Emitter<RealtimeEvents>
  implements RealtimeClient
{
  protected ws!: WebSocket
  protected from?: string
  protected connected = false
  protected wsUrl: string

  private manualClose = false
  private reconnectTimer: number | undefined
  private reconnectAttempts = 0
  private readonly maxBackoffMs = 30_000

  private heartBeat: WebsocketHeartbeat

  constructor(wsUrl: string, from?: string) {
    super()
    this.wsUrl = wsUrl
    this.from = from

    // Create heartbeat first, but DO NOT bind a socket yet.
    this.heartBeat = new WebsocketHeartbeat({
      from: this.from,
      // Prefer passing a getter or exposing an attach() on heartbeat.
      getWs: () => this.ws,
      onTimeout: () => this.handleHeartbeatTimeout(),
    })

    this.init()
  }

  public isConnected() {
    return this.connected
  }

  protected emitConnect() {
    this.emit(RealtimeEvents.Connected, this.connected)
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
    this.emit(RealtimeEvents.Connecting)
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

    const onDead = (event?: CloseEvent | Event) => {
      this.connected = false
      this.emitConnect()
      this.heartBeat.stop()
      if (!this.manualClose) {
        if (typeof CloseEvent !== "undefined" && event instanceof CloseEvent) {
          logger.error(
            "Websocket connection closed unexpectedly",
            this.getDebugContext({
              code: event.code,
              reason: event.reason,
              wasClean: event.wasClean,
            }),
            event
          )
        } else if (event) {
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
        this.emit(RealtimeEvents.Error, event ?? new Event("websocket-close"))
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
      this.emit(RealtimeEvents.Message, message)
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
      this.emit(RealtimeEvents.Message, message)
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
    this.reconnectTimer = window.setTimeout(() => {
      if (this.ws && this.ws.readyState === WebSocket.CONNECTING) return

      this.reconnectTimer = undefined
      this.reconnectAttempts++
      logger.log("Reconnecting… attempt", this.reconnectAttempts)
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

    try {
      // Close regardless of state (OPEN/CONNECTING/CLOSING)
      this.ws?.close()
      // @ts-ignore
      this.ws = undefined
    } catch {
      /* noop */
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
