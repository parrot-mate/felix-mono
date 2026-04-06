import { atomFamily, atomWithStorage } from "jotai/utils"

export const lastReadTimeAtom = atomFamily((threadHash: string) => {
  return atomWithStorage<number>(`chat-last-read:${threadHash}`, Date.now())
})
