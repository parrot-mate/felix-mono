import { atom } from "jotai"
import { atomFamily } from "jotai/utils"
import { isEqual } from "lodash"
import { bookStatsVersionAtom } from "./bookStatsVersionAtom"

export const bookStatsUpdateAtom = atomFamily((user: string) => {
  return atom(null, (_get, set, book: string) => {
    set(
      bookStatsVersionAtom({
        user,
        bookId: book,
      }),
      (v) => v + 1
    )
  })
}, isEqual)
