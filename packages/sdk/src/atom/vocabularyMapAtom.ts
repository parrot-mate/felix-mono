import { atomFamily, atomWithRefresh } from "jotai/utils"
import { aggregatorAtom } from "./aggregatorAtom"

export const vocabularyMapAtom = atomFamily((user: string) => {
  return atomWithRefresh(async (get) => {
    const agg = await get(aggregatorAtom(user))
    return agg.vocabularyMap
  })
})
