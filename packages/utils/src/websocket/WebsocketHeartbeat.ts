import { PING } from "@pmate/meta"
import { Logger } from "../Logger"

const logger = Logger.getDebugger("heartbeat")

export interface HeartbeatOptions {
  from?: string // client identifier
  getWs?: () => WebSocket // optional getter if ws can change
  onTimeout: () => void // callback on timeout
}

export class WebsocketHeartbeat {
  private intervalId: any = null
  private lastPong: number = Date.now()
  private readonly intervalMs: number
  private readonly timeoutMs: number
  private readonly onTimeout: () => void
  private readonly getWs?: () => WebSocket

  constructor(opts: HeartbeatOptions) {
    this.intervalMs = 5000
    this.timeoutMs = 15000
    this.onTimeout = opts.onTimeout
    this.getWs = opts.getWs
  }

  start() {
    if (this.intervalId) return
    this.lastPong = Date.now()

    this.intervalId = setInterval(() => {
      // send ping
      const ping = new Uint8Array([PING])
      this.getWs?.()?.send(ping)

      // check timeout
      if (Date.now() - this.lastPong > this.timeoutMs) {
        logger.log("Pong timeout")
        this.stop()
        this.onTimeout()
      }
    }, this.intervalMs)
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  handlePong() {
    this.lastPong = Date.now()
    logger.log("Pong received")
    return true
  }
}
