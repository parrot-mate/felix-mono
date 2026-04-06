import type { Msg as MsgType } from "@pmate/meta"
import type { EmitterMessage } from "../Emitter"
import { Emitter } from "../Emitter"
import { Logger } from "../Logger"
import { Msg } from "../Msg"
import {
  type RealtimeClient,
  RealtimeEvents,
  type RealtimeTransportKind,
} from "./WebsocketClient"

const logger = Logger.getDebugger("h3")

type WebTransportBidirectionalStream = {
  readable: ReadableStream<Uint8Array>
  writable: WritableStream<Uint8Array>
}

type WebTransportLike = {
  ready: Promise<void>
  closed: Promise<any>
  createBidirectionalStream: () => Promise<WebTransportBidirectionalStream>
  close?: (info?: any) => Promise<void> | void
}

export class H3Client extends Emitter<RealtimeEvents> implements RealtimeClient {
  private transport: WebTransportLike | null = null
  private stream: WebTransportBidirectionalStream | null = null
  private streamPromise: Promise<WebTransportBidirectionalStream> | null = null
  private readonly decoder = new TextDecoder()
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null
  private readonly readyPromise: Promise<void>
  private connected = false
  private manualClose = false

  constructor(private readonly h3Url: string) {
    super()
    this.readyPromise = this.connect().catch((error) => {
      throw error
    })
  }

  public static isSupported(): boolean {
    return typeof globalThis !== "undefined" && "WebTransport" in globalThis
  }

  public static create(h3Url: string) {
    if (!H3Client.isSupported()) {
      throw new Error("WebTransport not supported in this environment")
    }
    return new H3Client(h3Url)
  }

  on<T>(topic: RealtimeEvents, handler: (value: T) => void): () => void {
    return super.on(topic, handler)
  }

  onAll(
    handler: (message: EmitterMessage<RealtimeEvents, any>) => void
  ): () => void {
    return super.onAll(handler)
  }

  public isConnected(): boolean {
    return this.connected
  }

  public getConnectionType(): RealtimeTransportKind {
    return "h3"
  }

  private getDebugContext(
    additional?: Record<string, unknown>
  ): Record<string, unknown> {
    return {
      url: this.h3Url,
      connected: this.connected,
      manualClose: this.manualClose,
      hasTransport: Boolean(this.transport),
      hasWriter: Boolean(this.writer),
      hasReader: Boolean(this.reader),
      hasStream: Boolean(this.stream),
      ...additional,
    }
  }

  public async sendMsg(msg: MsgType<any>): Promise<void> {
    await this.readyPromise
    if (!this.transport) {
      throw new Error("H3 transport is not ready")
    }
    const stream = await this.getStream()
    const writable = stream.writable
    if (!this.writer) {
      this.writer = writable.getWriter()
    }
    const payload = await Msg.toWire(msg, "h3")
    try {
      await this.writer.write(payload)
      logger.log("sending h3 msg", payload)
    } catch (error) {
      logger.error(
        "Failed to send H3 message",
        this.getDebugContext({ payloadSize: payload.length }),
        error
      )
      throw error
    }
  }

  public close(manual = true): void {
    this.manualClose = manual
    this.connected = false
    this.writer?.releaseLock?.()
    this.writer = null
    if (this.reader) {
      this.reader
        .cancel()
        .catch(() => undefined)
        .finally(() => {
          this.reader?.releaseLock?.()
          this.reader = null
        })
    }
    this.stream = null
    this.streamPromise = null
    if (this.transport?.close) {
      try {
        void this.transport.close()
      } catch (error) {
        logger.error(
          "Failed to close WebTransport session",
          this.getDebugContext(),
          error
        )
      }
    }
    this.emit(RealtimeEvents.Connected, false)
  }

  private async connect(): Promise<void> {
    const transportCtor = (globalThis as any).WebTransport
    this.connected = false
    this.emit(RealtimeEvents.Connecting)
    this.transport = new transportCtor(this.h3Url) as WebTransportLike
    try {
      await this.transport.ready
      await this.getStream()
      this.connected = true
      this.emit(RealtimeEvents.Connected, true)
      this.transport.closed
        .then(() => this.handleTransportClosed())
        .catch((err: unknown) => this.handleTransportClosed(err))
    } catch (error) {
      this.connected = false
      this.emit(RealtimeEvents.Connected, false)
      this.emit(RealtimeEvents.Error, error)
      logger.error(
        "H3 connection attempt failed",
        this.getDebugContext(),
        error
      )
      throw error
    }
  }

  private async startReading(readable: ReadableStream<Uint8Array>) {
    if (this.reader) {
      this.reader.cancel().catch(() => undefined)
      this.reader.releaseLock?.()
    }
    const reader = readable.getReader()
    this.reader = reader
    try {
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        if (!value) continue
        this.handleIncomingPacket(value)
      }
    } catch (error) {
      if (!this.manualClose) {
        logger.error(
          "H3 bidirectional stream reader terminated unexpectedly",
          this.getDebugContext(),
          error
        )
      }
    } finally {
      if (this.reader === reader) {
        this.reader?.releaseLock?.()
        this.reader = null
      }
    }
  }

  private handleIncomingPacket(packet: Uint8Array) {
    try {
      const text = this.decoder.decode(packet)
      const parts = (text || "").split("\n").filter((x) => x)
      if (parts.length === 0) return
      for (const part of parts) {
        const message = Msg.decodeWire(part, "h3")
        logger.log("received h3 msg", message)
        this.emit(RealtimeEvents.Message, message)
      }
    } catch (error) {
      logger.error(
        "Failed to parse incoming H3 payload",
        this.getDebugContext({ packetSize: packet.byteLength }),
        error
      )
    }
  }

  private handleTransportClosed(error?: unknown) {
    this.connected = false
    this.stream = null
    this.streamPromise = null
    if (error && !this.manualClose) {
      logger.error(
        "H3 transport closed with error",
        this.getDebugContext(),
        error
      )
      this.emit(RealtimeEvents.Error, error)
    } else if (!this.manualClose) {
      this.emit(RealtimeEvents.Error, new Error("H3 transport closed"))
    }
    this.emit(RealtimeEvents.Connected, false)
  }

  private async getStream(): Promise<WebTransportBidirectionalStream> {
    if (this.stream) {
      return this.stream
    }
    if (!this.transport) {
      throw new Error("H3 transport is not ready")
    }
    if (!this.streamPromise) {
      this.streamPromise = this.transport
        .createBidirectionalStream()
        .then((stream) => {
          this.stream = stream
          this.writer?.releaseLock?.()
          this.writer = null
          this.startReading(stream.readable)
          return stream
        })
        .catch((error) => {
          this.streamPromise = null
          throw error
        })
    }
    return this.streamPromise
  }
}
