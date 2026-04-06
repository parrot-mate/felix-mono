import { atomFamily } from "jotai/utils"
import { atom } from "jotai"
import { bookAtom } from "@pmate/sdk"
import { isEqual } from "lodash"
import { Logger } from "@pmate/utils"

interface PageParams {
  id: string
  pageNo: number
}
const logger = Logger.getDebugger("pageAtom")
export const pageAtom = atomFamily(
  (params: PageParams) =>
    atom(async (get) => {
      const book = await get(bookAtom(params.id))

      logger.log({ params, book })
      return book.map((book) => book.punchPages[params.pageNo])
    }),
  (a, b) => isEqual(a, b)
)
