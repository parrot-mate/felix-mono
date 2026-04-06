import { atom } from "jotai"
import { atomFamily } from "jotai/utils"

export const rtcConnectedAtom = atomFamily((_: string) => {
  return atom(false)
})
