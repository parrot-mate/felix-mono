import { aggregatorAtom } from "./aggregatorAtom"
import { appendUserLogAtom } from "./appendUserLogAtom"
import { profileAtom } from "@pmate/account-sdk"
import { ContextQAItem, LogType } from "@pmate/meta"
import { HashType, uniqHash } from "@pmate/utils"
import { atom } from "jotai"
import { atomFamily } from "jotai/utils"
import { atomWithLoadable } from "@sdk/util/atomWithLoadable"
import { createUserLog } from "@sdk/indexer/UserLogIndexer"

interface Params {
  book: string
  paragraphIndex: number
}

const versionAtom = atomFamily(
  (_: Params) => atom(0),
  (a, b) => a.book === b.book && a.paragraphIndex === b.paragraphIndex
)

export const contextQuestionAtom = atomFamily(
  (params: Params) =>
    atomWithLoadable(async (get) => {
      get(versionAtom(params))
      const profile = await get(profileAtom)
      const userId = profile?.id ?? ""
      const agg = await get(aggregatorAtom(userId))
      const key = uniqHash(
        `${params.book}:${params.paragraphIndex}`,
        HashType.ReadingQA
      )
      return agg.qaHistory[key] || []
    }),
  (a, b) => a.book === b.book && a.paragraphIndex === b.paragraphIndex
)

export const addContextQuestionAtom = atomFamily(
  (params: Params) =>
    atom(
      null,
      async (get, set, qa: { role: "user" | "assistant"; text: string }) => {
        const profile = await get(profileAtom)
        const userId = profile?.id ?? ""
        const item: ContextQAItem = {
          ...qa,
          bookId: params.book,
          paragraphId: params.paragraphIndex,
          key: uniqHash(
            `${params.book}:${params.paragraphIndex}`,
            HashType.ReadingQA
          ),
        }
        const log = await createUserLog(
          LogType.ContextQA,
          item,
          userId
        )
        await set(appendUserLogAtom, log)
        set(versionAtom(params), (v) => v + 1)
      }
    ),
  (a, b) => a.book === b.book && a.paragraphIndex === b.paragraphIndex
)
