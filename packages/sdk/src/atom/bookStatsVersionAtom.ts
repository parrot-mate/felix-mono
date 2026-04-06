import { atom } from "jotai"
import { atomFamily } from "jotai/utils"
import { isEqual } from "lodash"

interface BookParams {
  user: string
  bookId: string
}

export const bookStatsVersionAtom = atomFamily((_: BookParams) => {
  return atom(0)
}, isEqual)
