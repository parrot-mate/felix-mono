import { atomFamily, atomWithRefresh } from "jotai/utils"
import { isEqual } from "lodash"
import { profileByIdAtom } from "@pmate/account-sdk"

export const peerAtom = atomFamily((params: { id: string }) => {
  return atomWithRefresh(async (get) => {
    const profile = await get(profileByIdAtom(params.id))
    return profile
  })
}, isEqual)
