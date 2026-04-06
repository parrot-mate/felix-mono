import { MsgOp, Revised } from "@pmate/meta"
import { atom } from "jotai"

type PendingConfirm = {
  revising: boolean
  hash: string
  revised: Revised | null
}

export const pendingConfirmAtom = atom<PendingConfirm | null>(null)
