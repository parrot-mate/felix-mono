import { atom } from "jotai"
import { atomFamily } from "jotai/utils"
import { pageAtom } from "./pageAtom"
import { readingRecordAtom } from "./readingRecordAtom"
import { atomAsync } from "@/util/atomAsync"
import { isEqual } from "lodash"

interface PageParams {
  id: string
  pageNo: number
  pid: number
}
export const readingPercentAtom = atomFamily(
  (params: PageParams) =>
    atomAsync(async (get) => {
      const page = await get(pageAtom(params))

      return page.map((page) => {
        let total = 0
        let readed = 0

        for (let p of page.paragraphs) {
          total += p.words.length
          if (p.index < params.pid) {
            readed += p.words.length
          }
        }
        return (readed * 100) / total
      })
    }),
  (a, b) => isEqual(a, b)
)
