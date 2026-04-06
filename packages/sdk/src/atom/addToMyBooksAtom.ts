import { atom } from "jotai"
import { Logger } from "@pmate/utils"
import { LogType } from "@pmate/meta"

import { createUserLog } from "@sdk/indexer/UserLogIndexer"
import { appendUserLogAtom } from "./appendUserLogAtom"
import { libraryItemAtom } from "./libraryItemAtom"
import { profileAtom } from "@pmate/account-sdk"

const logger = Logger.getDebugger("addToMyBooksAtom")

export const addToMyBooksAtom = atom(null, async (get, set, id: string) => {
  logger.log("add book to my books", id)
  const items = await get(libraryItemAtom)
  const book = items.unwrapOr([]).find((entry) => entry.id === id)
  if (book) {
    const profile = await get(profileAtom)
    const userId = profile?.id ?? ""
    const log = await createUserLog(LogType.Books, { op: 0, book }, userId)
    await set(appendUserLogAtom, log)
  }
})
