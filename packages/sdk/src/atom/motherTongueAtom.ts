import { normalizeLang } from "@pmate/lang"
import { atom } from "jotai"
import { profileAtom } from "@pmate/account-sdk"

export const motherTongueAtom = atom((get) => {
  const profile = get(profileAtom)
  return normalizeLang(profile?.motherTongue, "zh-CN")
})
