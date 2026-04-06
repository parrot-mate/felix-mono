import { apiUpdateGroup } from "@pmate/sdk"
import { profileAtom } from "@pmate/account-sdk"
import { roomAtom, sendMessageAtom } from "@pmate/sdk"
import { MsgKind, MsgOp } from "@pmate/meta"
import { wait } from "@pmate/utils"
import { atom } from "jotai"

export const updateGroupAtom = atom(
  null,
  async (
    get,
    set,
    threadHash: string,
    groupName: string,
    avatar: string,
    peers: string[]
  ) => {
    const profile = get(profileAtom)
    const userId = profile?.id ?? ""
    if (!userId) {
      throw new Error("No user")
    }
    const room = await get(roomAtom(threadHash))
    if (!room) {
      throw new Error("room not found")
    }
    const oldPeers = room.peers
    const groupId = threadHash.replace(/^group@/, "")
    await apiUpdateGroup({
      id: groupId,
      title: groupName,
      avatar,
      members: peers,
    })
    await wait(100)
    const added = peers.filter((p) => !oldPeers.includes(p))
    const removed = oldPeers.filter((p) => !peers.includes(p))
    if (added.length > 0) {
      await set(
        sendMessageAtom as any,
        MsgKind.GROUP,
        threadHash,
        MsgOp.GROUP_NEW_PEERS,
        { peers: added },
        undefined
      )
    }
    if (removed.length > 0) {
      await set(
        sendMessageAtom as any,
        MsgKind.GROUP,
        threadHash,
        MsgOp.GROUP_REMOVE_PEERS,
        { peers: removed },
        undefined
      )
    }
  }
)
