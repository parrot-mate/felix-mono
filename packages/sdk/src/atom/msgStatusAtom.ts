import { MsgStatus } from "@pmate/meta"
import { atom } from "jotai"
import { atomFamily } from "jotai/utils"

export const msgStatusAtom = atomFamily((_: string) => {
  return atom<MsgStatus>(MsgStatus.PENDING)
})
