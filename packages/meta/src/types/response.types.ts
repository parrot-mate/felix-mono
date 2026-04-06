import type { RoomType } from "./chat.types"
import type { Msg, MsgOp } from "./message.types"

export interface ThreadResponse {
  threadHash: string
  type: RoomType
  lastUpdateAt: number
  lastMessage: Msg<MsgOp>
  total: number
  unread: number
  associated: string // for dm: profileId, for group: groupId
}
