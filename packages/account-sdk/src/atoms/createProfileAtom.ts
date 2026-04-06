import { atom } from "jotai"
import { AccountManagerV2 } from "../utils/AccountManagerV2"
import { profileDraftAtom } from "./profileDraftAtom"
import { resolveAppId } from "../utils/resolveAppId"

type CreateProfileParams = {
  nickName: string
}

export const createProfileAtom = atom(
  null,
  async (get, _set, { nickName }: CreateProfileParams) => {
    const draft = get(profileDraftAtom)
    const bootstrapManager = AccountManagerV2.get(resolveAppId())
    const account = await bootstrapManager.getAccountState()

    if (!account) {
      throw new Error("Account info is missing for profile creation")
    }

    const manager = AccountManagerV2.get(resolveAppId(account.app))
    return manager.createProfile({
      nickName,
      learningTargetLang: draft.learningTargetLang,
    })
  }
)
