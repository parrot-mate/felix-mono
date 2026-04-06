import { Profile } from "@pmate/meta"
import { atomWithLoadable } from "./atomWithLoadable"
import { ProfileService } from "../api/ProfileService"
import { resolveAppId } from "../utils/resolveAppId"
import { AccountManagerV2 } from "../utils/AccountManagerV2"
import { accountAtom } from "./accountAtom"

export const profilesAtom = atomWithLoadable<Profile[]>(async (get) => {
  get(accountAtom)
  const manager = AccountManagerV2.get(resolveAppId())
  const acc = await manager.getAccountState()
  if (!acc) {
    return [] as Profile[]
  }
  try {
    return await ProfileService.getProfiles(acc)
  } catch {
    return [] as Profile[]
  }
})
