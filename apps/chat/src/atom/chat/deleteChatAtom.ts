import { sendMessageAtom } from "@pmate/sdk"
import { MsgKind, MsgOp } from "@pmate/meta"
import { atom } from "jotai"

export const deleteChatAtom = atom(null, async (_, set, threadHash: string) => {
  const kind = threadHash.startsWith("dm@") ? MsgKind.DM : MsgKind.GROUP
  await set(
    sendMessageAtom as any,
    kind,
    "@dummy",
    MsgOp.DELETE_CHAT,
    null,
    undefined
  )
})
