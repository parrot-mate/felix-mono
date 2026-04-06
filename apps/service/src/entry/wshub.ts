import { Msg, MsgOp, PING, PONG } from "@pmate/meta"
import { isMsgType } from "@pmate/utils"
import { decode as decodeMessagePack } from "@msgpack/msgpack"
import cors from "cors"
import express from "express"
import http from "http"
import WebSocket from "ws"

const app = express()

const corsConfig = {
  origin: [
    /localhost(:\d+)?$/, // Allows localhost and any port (e.g., localhost:3000)
    /\.skedo\.cn$/, // Allows any subdomain of skedo.cn
  ],
  methods: ["GET", "OPTIONS"], // Adjust the methods to those that make sense
  allowedHeaders: ["Content-Type", "Authorization"], // Adjust allowed headers
}
app.use(cors(corsConfig))

const PORT = process.env.PORT || 8002
const server = http.createServer(app)

const wss = new WebSocket.Server({
  server,
  path: "/hub", // Match the path with the one used by Socket.IO
})

const users: Map<string, WebSocket> = new Map()

wss.on("connection", (ws) => {
  ws.on("message", (data) => {
    if (Buffer.isBuffer(data) && data.length === 1 && data[0] === PING) {
      ws.send(Buffer.from([PONG]))
      return
    }

    const buffer = Buffer.isBuffer(data)
      ? data
      : Buffer.from(data as ArrayBufferLike)
    try {
      const msg = decodeMessagePack(buffer) as Msg<
        MsgOp.PIPELINE_CALL | MsgOp.PIPELINE_ACK | MsgOp.PIPELINE_JOIN
      >

      if (msg.opcode === MsgOp.PIPELINE_JOIN) {
        console.log("User joined", msg.from)
      }

      if (msg.from) {
        users.set(msg.from, ws) // Update users map for all messages
      }

      if (msg.opcode !== MsgOp.PIPELINE_JOIN && msg.to) {
        shortLogMsg(msg)
        if (users.has(msg.to)) {
          users.get(msg.to)?.send(buffer) // Forward message if not "join"
        } else {
          console.error("User not found", msg.to)
        }
      }
    } catch (error) {
      console.error("Invalid message format", error)
    }
  })

  ws.on("close", () => {
    for (const [key, user] of users.entries()) {
      if (user === ws) {
        users.delete(key)
        console.log("User left", key)
        break
      }
    }
  })

  ws.on("error", (err) => {
    console.error("WebSocket error", err)
  })
})

// Function to renew the users map if needed
function renewUsersMap() {
  for (const [key, user] of users.entries()) {
    if (user.readyState !== WebSocket.OPEN) {
      console.log("Removing inactive user", key)
      users.delete(key)
    }
  }
}

setInterval(renewUsersMap, 30000) // Clean up inactive users every 30s

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err)
  process.exit(1) // Exit gracefully after logging the error
})

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", reason)
  process.exit(1) // Exit gracefully after logging the error
})

function shortLogMsg(
  msg:
    | Msg<MsgOp.PIPELINE_CALL>
    | Msg<MsgOp.PIPELINE_ACK>
    | Msg<MsgOp.PIPELINE_JOIN>
) {
  if (!msg.body) {
    return
  }

  function addr(str: string) {
    if (str.length > 12) {
      return str.slice(0, 8) + "..." + str.slice(-4)
    }
    return str
  }
  if (isMsgType(msg, MsgOp.PIPELINE_CALL)) {
    const op = ` op=${msg.body.op} `
    const l = getDataLength(msg.body?.data)
    console.log(
      `[${addr(msg.from)} -> ${addr(msg.to)}]${op}${MsgOp[msg.opcode]} len=${l}`
    )
  }
  if (isMsgType(msg, MsgOp.PIPELINE_ACK)) {
    const l = getDataLength(msg.body?.data)
    console.log(
      `[${addr(msg.from)} -> ${addr(msg.to)}] ${MsgOp[msg.opcode]} len=${l}`
    )
  }
}

function getDataLength(data: unknown) {
  if (!data) return 0
  if (typeof data === "string") return data.length
  if (data instanceof Uint8Array || Buffer.isBuffer(data)) return data.length
  if (Array.isArray(data)) return data.length
  return 0
}
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
