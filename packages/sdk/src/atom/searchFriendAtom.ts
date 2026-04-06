import { Profile, RelationshipStatus } from "@pmate/meta"
import { RelationShipService } from "@sdk/api"
import { atomWithLoadable } from "@pmate/uikit"
import { atom } from "jotai"
import { profileAtom, profileByIdAtom } from "@pmate/account-sdk"
import { relationshipAtom } from "./relationshipAtom"

export interface SearchResult {
  profile: Profile
  relationship: RelationshipStatus
}

export const searchKeywordAtom = atom("")
export const searchFriendAtom = atomWithLoadable<SearchResult>(async (get) => {
  const keyword = get(searchKeywordAtom).trim()
  if (keyword.length < 8) {
    return null
  }

  const me = get(profileAtom)
  const myId = me?.id ?? ""
  const n = keyword.trim()
  if (!n) return null
  try {
    const profileId = await RelationShipService.findFriend(n)
    const profile = await get(profileByIdAtom(profileId))
    if (profile) {
      const relationship = await get(
        relationshipAtom({ from: profileId, to: myId })
      )
      return {
        profile,
        relationship,
      }
    }
    return null
  } catch (e) {
    return null
  }
})
