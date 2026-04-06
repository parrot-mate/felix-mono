import { getSafeInsets } from "@pmate/bridge"
import { atom } from "jotai"

export const safeInsetsNativeAtom = atom(async () => {
  return getSafeInsets()
})