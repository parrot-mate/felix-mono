import { normalizeLang } from "@pmate/lang"
import { atom } from "jotai"
import { profileAtom } from "./accountProfileAtom"

export const learningLangAtom = atom((get) => {
  const profile = get(profileAtom)
  return normalizeLang(profile?.learningTargetLang)
})
