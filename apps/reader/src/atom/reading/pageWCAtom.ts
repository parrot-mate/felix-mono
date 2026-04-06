import { atom } from "jotai"
import { atomFamily } from "jotai/utils"
import { isEqual } from "lodash"
import { bookAtom } from "@pmate/sdk"
import { Logger } from "@pmate/utils"
import { atomAsync } from "@/util/atomAsync"

interface PageStatusParam {
  id: string
  index: number
}

const logger = Logger.getDebugger("pageWCAtom")

export const pageWCAtom = atomFamily(
  (param: PageStatusParam) =>
    atomAsync(async (get) => {
      const book = await get(bookAtom(param.id))
      const wc = book.map((book) => {
        const page = book.punchPages[param.index]
        const wc = page.paragraphs.reduce((acc, p) => {
          return acc + p.words.length
        }, 0)

        return wc
      })
      return wc
    }),
  (a, b) => isEqual(a, b)
)
