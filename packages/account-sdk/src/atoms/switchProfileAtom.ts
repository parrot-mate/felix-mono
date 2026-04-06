import { Profile } from "@pmate/meta"
import { atom } from "jotai"
import { AccountManagerV2 } from "../utils/AccountManagerV2"
import { resolveAppId } from "../utils/resolveAppId"

export const switchProfileAtom = atom(null, (_get, _, profile: Profile) => {
  const app = resolveAppId(profile.app)
  AccountManagerV2.get(app).setSelectedProfile(profile)
})
