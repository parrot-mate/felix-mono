import type { ThreadInfoV2 } from "@pmate/meta"
import { atom } from "jotai"
import { atomFamily } from "jotai/utils"

type ThreadAtomParams = {
  userId: string
  threadHash: string
}

type ThreadAtomUpdate =
  | ThreadInfoV2
  | null
  | ((prev: ThreadInfoV2 | null) => ThreadInfoV2 | null)

export const threadAtomV2 = atomFamily(
  ({ userId, threadHash }: ThreadAtomParams) => {
    const valueAtom = atom<ThreadInfoV2 | null>(null)
    return atom(
      (get) => get(valueAtom),
      (_, set, update: ThreadAtomUpdate) => {
        if (!userId || !threadHash) {
          return
        }
        if (typeof update === "function") {
          set(
            valueAtom,
            update as (prev: ThreadInfoV2 | null) => ThreadInfoV2 | null
          )
        } else {
          set(valueAtom, update)
        }
      }
    )
  },
  (a, b) => a.userId === b.userId && a.threadHash === b.threadHash
)
