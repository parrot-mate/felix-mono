import { atom } from "jotai"
import { atomFamily } from "jotai/utils"
import { lastPositionVersionAtom } from "./lastPositionVersionAtom"

export const lastPositionUpdateAtom = atomFamily((user: string) => {
  return atom(null, (_get, set, bookId: string) => {
    set(lastPositionVersionAtom({ user, bookId }), (v) => v + 1)
  })
})
