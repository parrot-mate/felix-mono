import { MsgKind, MsgOp } from "@pmate/meta"
import type { Msg, MsgBodyMap, MsgSendOptions } from "@pmate/meta"
import { HashType, uniqHash } from "./uniqHash"

let msgSeq = 0

export function createMsg<T extends MsgOp>(
  from: string,
  to: string,
  opcode: MsgOp,
  body: MsgBodyMap[T],
  kind: MsgKind = MsgKind.DM,
  options?: MsgSendOptions
) {
  const seq = nextMsgSeq()
  const msg: Msg<any> = {
    hash: "",
    t: Date.now(),
    from: from,
    to,
    body,
    kind,
    opcode,
    pending: options?.pending,
    quote: options?.quote,
  }

  msg.hash = msgHash(msg, seq)
  return msg
}

const msgHash = (msg: Msg<any>, seq: number) => {
  const info = `${msg.t}:${msg.from}:${msg.to}:${msg.opcode}:${msg.quote}:${seq}`
  return uniqHash(info, HashType.MSG)
}

const nextMsgSeq = () => {
  msgSeq = (msgSeq + 1) % Number.MAX_SAFE_INTEGER
  return msgSeq
}

export function isMsgType<T extends MsgOp>(
  msg: Msg<any>,
  type: T
): msg is Msg<T> {
  return msg.opcode === type
}
