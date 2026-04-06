import { atomWithRefresh, atomFamily } from "jotai/utils"
import { aggregatorAtom } from "./aggregatorAtom"

export const balanceAtom = atomFamily((user: string) => {
  return atomWithRefresh(async (get) => {
    const agg = await get(aggregatorAtom(user))
    return agg.account.amountIn - agg.account.amountOut
  })
})
