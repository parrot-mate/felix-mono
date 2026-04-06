require("../env")
import { Msg, MsgKind, MsgOp, PING, PONG } from "@pmate/meta"
import { createMsg } from "@pmate/utils"
import { decode as decodeMessagePack, encode as encodeMessagePack } from "@msgpack/msgpack"
import { WebSocket } from "ws"
import { handleGenerateImage } from "../runner/handleGenerateImage"
import { handleParse } from "../runner/handleParse"
import { handleRunPrompt } from "../runner/handleRunPrompt"
import { POSS } from "../util/alioss"

export class Runner {
  private ws: WebSocket | null = null
  private heartbeatInterval: NodeJS.Timer | null = null
  private reconnectTimeout: NodeJS.Timer | null = null
  // Adjust these values as needed
  private readonly heartbeatIntervalMs = 30000 // 30 seconds
  private readonly reconnectDelayMs = 5000 // 5 seconds

  /**
   * @param addr The unique identifier for the client.
   */
  constructor(private addr: string) {}

  /**
   * Starts the connection to the WebSocket server.
   */
  public start(): void {
    this.connect()
  }

  /**
   * Establishes the WebSocket connection and sets up event handlers.
   */
  private connect(): void {
    this.ws = new WebSocket(process.env.HUB_ENDPOINT!)

    this.ws.on("open", this.onOpen.bind(this))
    this.ws.on("message", this.onMessage.bind(this))
    this.ws.on("close", this.onClose.bind(this))
    this.ws.on("error", this.onError.bind(this))
  }

  /**
   * Handler for the 'open' event.
   */
  private onOpen(): void {
    console.log(`Connected to ${process.env.HUB_ENDPOINT!}.`)

    // Send a join message after connecting
    const msg = createMsg(
      this.addr,
      "",
      MsgOp.PIPELINE_JOIN,
      null,
      MsgKind.PIPELINE
    )
    console.log("Sent JOIN message.")
    this.sendMessage(msg)

    // Start sending heartbeat pings to keep the connection alive
    this.startHeartbeat()
  }

  /**
   * Handler for incoming messages.
   * @param data The raw data received from the server.
   */
  private async onMessage(data: any) {
    if (Buffer.isBuffer(data) && data.length === 1 && data[0] === PONG) {
      const pong = Buffer.from([PONG])
      this.ws?.send(pong)
      return
    }

    const buffer = Buffer.isBuffer(data)
      ? data
      : Buffer.from(data as ArrayBufferLike)
    const message = decodeMessagePack(buffer) as Msg<MsgOp.PIPELINE_CALL>
    const { id } = message.body
    const { type, params } = message.body.data as {
      type: string
      params: any
    }

    let respData: any = null
    try {
      if (message.opcode === MsgOp.PIPELINE_CALL) {
        if (type === "generate-image") {
          // const { prompt, portrait, steps, guidance } = params
          await handleGenerateImage(params)
        } else if (type === "run-prompt") {
          respData = await handleRunPrompt(params)
        } else if (type === "parse") {
          respData = await handleParse(params)
        } else if (type === "save-prompt-config") {
          const { prompts } = params
          await POSS.publicOSS.uploadJsonToOSS(`/prompts/update.json`, prompts)
        } else {
          throw new Error(`Unknown call type: ${type}`)
        }
        const ack = createMsg(
          this.addr,
          message.from,
          MsgOp.PIPELINE_ACK,
          {
            id,
            success: true,
            data: respData,
            type: "final",
          },
          MsgKind.PIPELINE
        )
        this.sendMessage(ack)
      }
    } catch (ex: any) {
      console.error("Error processing message:", ex)
      const ack = createMsg(
        this.addr,
        message.from,
        MsgOp.PIPELINE_ACK,
        {
          id,
          success: false,
          message: ex.toString(),
          data: null,
        },
        MsgKind.PIPELINE
      )
      this.sendMessage(ack)
    }
  }

  /**
   * Handler for the 'close' event.
   */
  private onClose(): void {
    console.log("Connection closed.")
    this.stopHeartbeat()

    // Attempt to reconnect after a delay
    this.reconnectTimeout = setTimeout(() => {
      console.log("Reconnecting...")
      this.connect()
    }, this.reconnectDelayMs)
  }

  /**
   * Handler for errors.
   * @param error The error encountered.
   */
  private onError(error: Error): void {
    console.error("WebSocket error:", error)
  }

  /**
   * Sends a message through the WebSocket connection.
   * @param msg The message to send.
   */
  private sendMessage<T extends MsgOp>(msg: Msg<T>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const payload = encodeMessagePack(msg)
      this.ws.send(Buffer.from(payload))
    } else {
      console.error("WebSocket is not open. Cannot send message.")
    }
  }

  /**
   * Starts a heartbeat that sends a ping at regular intervals.
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(Buffer.from([PING]))
      }
    }, this.heartbeatIntervalMs)
  }

  /**
   * Stops the heartbeat when the connection is closed.
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval as any)
      this.heartbeatInterval = null
    }
  }
}

console.log("Starting runner...", process.argv[2])
const runner = new Runner(process.argv[2])
runner.start()
