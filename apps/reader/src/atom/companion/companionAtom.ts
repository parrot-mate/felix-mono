import { atom } from "jotai"
import { userSettingsAtom } from "@pmate/account-sdk"
import { Characters } from "./characters"

export const companionAtom = atom(async (get) => {
  const companionName = await get(userSettingsAtom("companion"))
  return Characters.find((x) => x.name === companionName) || Characters[0]
})
