import { atom } from "jotai"
import { atomFamily } from "jotai/utils"
import { aggregatorAtom } from "./aggregatorAtom"
import { paragraphReadVersionAtom } from "./paragraphReadVersionAtom"

interface BookParams {
  user: string
  bookId: string
}

export const paragraphReadAtom = atomFamily(
  (params: BookParams) => {
    return atom(async (get) => {
      get(paragraphReadVersionAtom(params))
      const agg = await get(aggregatorAtom(params.user))
      const readed = agg.readingRecords[params.bookId] || {}
      return readed
    })
  },
  (a, b) => a.bookId === b.bookId && a.user === b.user
)
