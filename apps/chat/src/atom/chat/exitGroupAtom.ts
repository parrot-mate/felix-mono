import { atom } from "jotai"
import { profileAtom } from "@pmate/account-sdk"
import { roomAtom, threadsAtomV2 } from "@pmate/sdk"
import { removeContactAtom } from "./removeContactAtom"
import { deleteChatAtom } from "./deleteChatAtom"

export const exitGroupAtom = atom(
  null,
  async (get, set, threadHash: string) => {
    const profile = get(profileAtom)
    const userId = profile?.id ?? ""
    if (!userId) return
    const room = await get(roomAtom(threadHash))
    if (!room || room.type !== "group") return
    await set(deleteChatAtom, threadHash)
    // TODO: Backend no longer provides a group exit API. Keeping local cleanup.
    await set(removeContactAtom, threadHash)
    set(threadsAtomV2(userId))
  }
)
