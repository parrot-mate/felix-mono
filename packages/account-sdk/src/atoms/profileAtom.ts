import { Profile } from "@pmate/meta"
import { atomWithRefresh } from "jotai/utils"
import { atomFamily, type AtomFamily } from "jotai-family"
import type { WritableAtom } from "jotai"
import { EntityService } from "../api/EntityService"

type ProfileByIdAtomFamily = AtomFamily<
  string,
  WritableAtom<Promise<Profile | null>, [], void>
>

export const profileByIdAtom: ProfileByIdAtomFamily = atomFamily(
  (profileId: string) =>
    atomWithRefresh(async () => {
      if (!profileId) {
        return null
      }
      try {
        return await EntityService.entity<Profile>(profileId)
      } catch {
        return null
      }
    })
)
