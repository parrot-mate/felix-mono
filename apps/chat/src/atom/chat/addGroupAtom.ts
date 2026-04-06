import { profileAtom } from "@pmate/account-sdk"
import { SocialService, waitFinalize } from "@pmate/sdk"
import { atom } from "jotai"

export const addGroupAtom = atom(
  null,
  async (get, _set, groupName: string, avatar: string, peers: string[]) => {
    const profile = get(profileAtom)
    const userId = profile?.id ?? ""
    if (!userId) {
      throw new Error("No user")
    }
    const group = await SocialService.createGroup({
      ownerId: userId,
      title: groupName,
      avatar,
      members: peers,
    })
    await waitFinalize()
    return group.id
  }
)
