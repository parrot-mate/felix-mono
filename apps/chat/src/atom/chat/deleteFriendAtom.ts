import { profileAtom } from "@pmate/account-sdk"
import { refreshRelationshipAtom, sendMessageAtom, threadsAtomV2 } from "@pmate/sdk"
import { MsgKind, MsgOp } from "@pmate/meta"
import { wait } from "@pmate/utils"
import { atom } from "jotai"
import { deleteChatAtom } from "./deleteChatAtom"
import { removeContactAtom } from "./removeContactAtom"

interface Params {
  threadHash: string
  otherId: string
}

export const deleteFriendAtom = atom(null, async (get, set, params: Params) => {
  const profile = get(profileAtom)
  const userId = profile?.id ?? ""
  if (!userId) return
  const { threadHash, otherId } = params
  const kind = threadHash.startsWith("dm@") ? MsgKind.DM : MsgKind.GROUP
  await set(
    sendMessageAtom as any,
    kind,
    otherId,
    MsgOp.FRIEND_DELETE,
    null,
    undefined
  )
  await set(deleteChatAtom, threadHash)
  await wait(250)
  await set(removeContactAtom, otherId)
  set(
    refreshRelationshipAtom,
    {
      from: userId,
      to: otherId,
    } as { from: string | undefined; to: string | undefined }
  )
  set(threadsAtomV2(userId))
})
