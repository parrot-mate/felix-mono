import type { LangShort } from "./lang.types"

/**
 * Binary frame constant used to send a heartbeat ping in the WebSocket mechanism.
 * Helps detect and maintain active connections between client and server.
 */
export const PING = 0x01
/**
 * Binary frame constant used to respond to a heartbeat ping in the WebSocket mechanism.
 * Indicates an active connection in response to a PING frame.
 */
export const PONG = 0x02

export enum MsgOp {
  LEFT = 5,
  TEXT = 16,
  HELLO = 18,
  EMOJI = 19,
  IMAGE = 20,
  GROUP_NEW_PEERS = 24,
  GROUP_REMOVE_PEERS = 25,
  FRIEND_DELETE = 26,
  DELETE_CHAT = 27,
  REJECT = 32,
  PIPELINE_CALL = 33,
  PIPELINE_ACK = 34,
  PIPELINE_JOIN = 35,
  SYSTEM_NOTIFY = 36,
  RECALL = 49,
  AUTH = 1000,
  AUTH_ACK = 1001,
  AGENT_REQUEST = 1002,
  AGENT_RESPONSE = 1003,
  LAST_POSITION = 8194,
}

export enum SYSTEM_NOTIFY_CODE {
  DM_ACL_REJECT = 4000,
  GROUP_ACL_REJECT = 4001,
}

export const USER_MESSAGE_OPS = new Set([
  MsgOp.RECALL,
  MsgOp.EMOJI,
  MsgOp.IMAGE,
  MsgOp.TEXT,
  MsgOp.HELLO,
  MsgOp.GROUP_NEW_PEERS,
  MsgOp.GROUP_REMOVE_PEERS,
  MsgOp.FRIEND_DELETE,
  MsgOp.DELETE_CHAT,
])
export enum MsgStatus {
  PENDING = 0,
  FULLFILLED = 1,
}

export type MsgBodyMap = {
  [MsgOp.TEXT]: {
    text: string
    lang: LangShort
    voice: string
    instructions: string
    isAskingFriend?: boolean
    raw?: string
  }
  [MsgOp.EMOJI]: {
    code: string
  }
  [MsgOp.IMAGE]: {
    url: string
  }
  [MsgOp.GROUP_NEW_PEERS]: { peers: string[] }
  [MsgOp.GROUP_REMOVE_PEERS]: { peers: string[] }
  [MsgOp.FRIEND_DELETE]: null
  [MsgOp.DELETE_CHAT]: null
  [MsgOp.REJECT]: {
    message: string
  }
  [MsgOp.HELLO]: null
  [MsgOp.PIPELINE_CALL]: PipelineRequest
  [MsgOp.PIPELINE_ACK]: PipelineResponse
  [MsgOp.PIPELINE_JOIN]: null
  [MsgOp.SYSTEM_NOTIFY]: {
    code: SYSTEM_NOTIFY_CODE
    msg_hash?: string // Related message Hash
  }
  [MsgOp.LEFT]: null
  [MsgOp.RECALL]: {
    hash: string
  }
  [MsgOp.AUTH]: {
    token: string
    as: "user" | "agent"
  }
  [MsgOp.AUTH_ACK]: {
    success: boolean
    reason?: string
  }
  [MsgOp.AGENT_REQUEST]: AgentRequest
  [MsgOp.AGENT_RESPONSE]: AgentResponse

  [MsgOp.LAST_POSITION]: {
    position: number
  }
}

export type MSGPendingSetting = {
  expire: number
}

export enum MsgKind {
  PIPELINE = 0,
  DM = 1,
  GROUP = 2,
}
export interface Msg<T extends MsgOp> {
  hash: string
  t: number
  from: string
  to: string
  pending?: MSGPendingSetting
  body: MsgBodyMap[T]
  opcode: MsgOp
  kind: MsgKind
  quote?: string
}

export interface Thread {
  hash: string
  messages: Msg<any>[]
}

export interface PipelineRequest {
  id: string
  op: PipelineOp // 0: start, 1: data, 2: end
  data: any
  meta?: Record<string, unknown>
}

export interface AgentRequest {
  taskId: string
  agentId: string
  op: PipelineOp

  type: string // mime type for payload, voice/image, "text" for text
  contentEncoding?: string
  payload?: any
}

export interface AgentResponse {
  taskId: string
  /**
   * true means task done, false means intermediate progress
   */
  success: boolean
  message?: string
  isFinal: boolean

  type: string // mime type for payload, voice/image, "text" for text
  contentEncoding?: string
  payload: any
}

export enum PipelineOp {
  Start = 0,
  Data = 1,
  End = 2,
}

export interface PipelineResponse {
  id: string
  /**
   * progress message indicates intermediate result, final means task done
   */
  type: "progress" | "final"
  success: boolean
  message?: string
  data: any
}

export interface Typing {
  form: "text" | "voice"
  pending: boolean
}

export interface MsgSendOptions {
  pending?: MSGPendingSetting
  quote?: string
}

export type Revised = {
  text: string
  voice: string
  lang: string
  instructions: string
  raw: string
  by: "text" | "voice"
  sender: "practitioner" | "helper"
}

export interface ReviseRecord {
  id: string
  raw: string
  revised: string
}
