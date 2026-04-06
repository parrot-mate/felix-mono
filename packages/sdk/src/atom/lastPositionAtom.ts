import { atomWithRefresh, atomFamily } from "jotai/utils"
import { aggregatorAtom } from "./aggregatorAtom"
import { BookParams, lastPositionVersionAtom } from "./lastPositionVersionAtom"

export const lastPositionAtom = atomFamily(
  (params: BookParams) =>
    atomWithRefresh(async (get) => {
      get(lastPositionVersionAtom(params))
      const agg = await get(aggregatorAtom(params.user))
      return agg.lastReadingPosition?.[params.bookId]?.pid || 0
    }),
  (a, b) => a.bookId === b.bookId && a.user === b.user
)
