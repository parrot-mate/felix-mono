import { MsgBodyMap, MsgKind, MsgOp, MsgSendOptions } from "@pmate/meta"
import { useAtomValue, useSetAtom } from "jotai"
import { useCallback } from "react"
import { sendMessageAtom } from "@sdk/atom/sendMessageAtom"
import { quotedMsgAtom } from "@sdk/atom/quotedMsgAtom"
import { useRoomContext } from "@sdk/provider/RoomProvider"

export const useSendMessage = () => {
  const { threadHash, roomType } = useRoomContext()
  const quoted = useAtomValue(quotedMsgAtom(threadHash))
  const _sendMsg = useSetAtom(sendMessageAtom)
  const sendMsg = useCallback(
    <T extends MsgOp>(
      to: string,
      opcode: T,
      body: MsgBodyMap[T],
      options?: MsgSendOptions
    ) => {
      const _options: MsgSendOptions = options ? { ...options } : {}
      if (quoted && !_options.quote) {
        _options.quote = quoted.hash
      }
      const kind = roomType === "dm" ? MsgKind.DM : MsgKind.GROUP
      return _sendMsg(kind, to, opcode, body, _options)
    },
    [_sendMsg, quoted, roomType]
  )
  return sendMsg
}