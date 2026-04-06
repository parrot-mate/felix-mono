import { BookReadingStats } from "@pmate/meta"
import { atomFamily, atomWithRefresh } from "jotai/utils"
import { isEqual } from "lodash"
import { aggregatorAtom } from "./aggregatorAtom"
import { bookStatsVersionAtom } from "./bookStatsVersionAtom"

interface BookParams {
  user: string
  bookId: string
}

export const bookStatsAtom = atomFamily((params: BookParams) => {
  return atomWithRefresh(async (get) => {
    get(bookStatsVersionAtom(params))
    const agg = await get(aggregatorAtom(params.user))
    return (
      agg.bookStats[params.bookId]! ||
      ({ finishedVolume: 0 } as BookReadingStats)
    )
  })
}, isEqual)
