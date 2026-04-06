import { atom } from "jotai"
import { atomFamily } from "jotai/utils"
import { paragraphReadVersionAtom } from "./paragraphReadVersionAtom"

export const paragrapReadUpdateAtom = atomFamily((user: string) => {
  return atom(null, (_get, set, bookId: string) => {
    set(paragraphReadVersionAtom({ user, bookId }), (v) => v + 1)
  })
})
