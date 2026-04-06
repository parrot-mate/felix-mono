import { atom } from "jotai"
import { AccountManagerV2 } from "../utils/AccountManagerV2"
import { resolveAppId } from "../utils/resolveAppId"

export const loginAtom = atom(null, async () => {
  const manager = AccountManagerV2.get(resolveAppId())
  return manager.login()
})
