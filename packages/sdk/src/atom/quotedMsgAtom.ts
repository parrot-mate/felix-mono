import { Msg, MsgOp } from "@pmate/meta"
import { atom } from "jotai"
import { atomFamily } from "jotai/utils"

export const quotedMsgAtom = atomFamily((_: string) => {
  return atom<Msg<MsgOp> | null>(null)
})
