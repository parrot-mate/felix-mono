import {
  Emitter,
  Logger,
  type RealtimeClient,
  WebsocketEvents,
} from "@pmate/utils"
import { Msg, MsgOp, USER_MESSAGE_OPS } from "@pmate/meta"
import { PeerEvents } from "./peer.def"

const logger = Logger.getDebugger("message")

export class MultiPeerClient extends Emitter<PeerEvents> {
  private initialized = false

  constructor(private userId: string, private socketClient: RealtimeClient) {
    super()
  }

  public async open() {
    if (this.initialized) {
      return
    }
    this.initialized = true
    this.socketClient.onAll(async (event) => {
      const { topic, body } = event
      logger.log(`MP: Received event: ${topic}`, body)
      try {
        if (topic === WebsocketEvents.Connected) {
          this.emit(PeerEvents.ConnectionStateChanged, body as boolean)
        } else if (topic === WebsocketEvents.Message) {
          const msg: Msg<any> = body
          if (
            USER_MESSAGE_OPS.has(msg.opcode) ||
            msg.opcode === MsgOp.SYSTEM_NOTIFY
          ) {
            this.emit(PeerEvents.Receive, msg)
          }

          switch (msg.opcode) {
            case MsgOp.REJECT: {
              this.emit(PeerEvents.Error, msg)
              break
            }
            case MsgOp.RECALL: {
              break
            }
            case MsgOp.TEXT:
            case MsgOp.IMAGE: {
              break
            }
          }
        }
      } catch (ex) {
        logger.error(`${ex}`)
      }
    })
  }

  public close() {}

  public sendMessage(message: Msg<any>) {
    this.socketClient.sendMsg(message)
    if (USER_MESSAGE_OPS.has(message.opcode)) {
      this.emit(PeerEvents.Sent, message)
    }
  }

  public isConnected() {
    if (!this.socketClient) {
      logger.error("socketClient is not initialized")
    }
    return this.socketClient.isConnected()
  }
}
