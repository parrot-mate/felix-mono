import { atom } from "jotai"
import { ProfileService } from "../api/ProfileService"
import { AccountManagerV2 } from "../utils/AccountManagerV2"
import { resolveAppId } from "../utils/resolveAppId"
import { profileAtom } from "./accountProfileAtom"
import { profileByIdAtom } from "./profileAtom"

export const updateProfileAtom = atom(
  null,
  async (get, _set, profileId: string, updates: Record<string, any>) => {
    const selected = get(profileAtom)
    const target =
      selected && selected.id === profileId
        ? selected
        : await get(profileByIdAtom(profileId))

    if (!target) {
      return
    }

    await ProfileService.updateProfile({
      profileId: target.id,
      ...updates,
    })

    const app = resolveAppId(target.app)
    const manager = AccountManagerV2.get(app)
    const updated = { ...target, ...updates }
    if (selected && selected.id === profileId) {
      manager.setSelectedProfile(updated)
    }

    await manager.getProfiles()
  }
)
