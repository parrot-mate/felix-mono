import { atom } from "jotai"

export enum AccountModalPhase {
  Login = "login",
  Register = "register",
  GenderSelector = "genderSelector",
  Nickname = "nickname",
  Finish = "finish",
}

export const userAccountModalAtom = atom<{
  open: boolean
  phase: AccountModalPhase
  next?: AccountModalPhase
}>({
  open: false,
  phase: AccountModalPhase.Login,
})
export const rewardModalAtom = atom({
  open: false,
  type: "punch",
})

export const profileSelectModalAtom = atom<boolean>(false)
