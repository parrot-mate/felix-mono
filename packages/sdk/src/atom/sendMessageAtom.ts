import { MsgKind, MsgOp, MsgSendOptions } from "@pmate/meta"

import { createMsg, Logger } from "@pmate/utils"
import { atom } from "jotai"
import { profileAtom } from "@pmate/account-sdk"
import { rtcAtom } from "./rtcAtom"
const logger = Logger.getDebugger("sendMessageAtom")
export const sendMessageAtom = atom(
  null,
  async (
    get,
    _set,
    kind: MsgKind,
    to: string,
    opcode: MsgOp,
    body: any,
    options?: MsgSendOptions
  ) => {
    const profile = await get(profileAtom)
    const userId = profile?.id ?? ""
    const rtc = await get(rtcAtom(userId))
    if (!rtc) {
      return
    }
    const _options: MsgSendOptions = options ? { ...options } : {}

    const msgBody = body === undefined ? ({} as any) : body
    const msg = createMsg(userId, to, opcode, msgBody, kind, _options)
    logger.log(msg)
    rtc.sendMessage(msg)
    return msg
  }
)
