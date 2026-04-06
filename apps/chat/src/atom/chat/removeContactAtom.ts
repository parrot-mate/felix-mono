import { atom } from "jotai"
import { profileAtom } from "@pmate/account-sdk"
import { refreshContactsAtom } from "@pmate/sdk"

export const removeContactAtom = atom(
  null,
  async (get, set, _otherId: string) => {
    const profile = get(profileAtom)
    const userId = profile?.id ?? ""
    if (!userId) return
    // TODO: Backend no longer supports removing contacts. Local refresh only.
    console.warn("removeContactAtom invoked but remove contact API is deprecated.")
    set(refreshContactsAtom)
  }
)
