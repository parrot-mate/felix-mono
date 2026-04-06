import { AccountState, Profile } from "@pmate/meta"
import { atom } from "jotai"
import { accountAtom } from "./accountAtom"

export const accountStateAtom = atom((get): AccountState | undefined => {
  const account = get(accountAtom).account
  return account ?? undefined
})

export const profileAtom = atom((get): Profile | undefined => {
  const profile = get(accountAtom).profile
  return profile ?? undefined
})
