import { LibraryItem, LogType } from "@pmate/meta"
import { profileAtom, userSettingsAtom } from "@pmate/account-sdk"
import {
  appendUserLogAtom,
  booksAtom,
  createUserLog,
  ReaderDB,
} from "@pmate/sdk"
import { Logger, Maybe } from "@pmate/utils"
import { atom } from "jotai"
import { atomWithRefresh } from "jotai/utils"

const logger = Logger.getDebugger("myBooksAtom")
export const myBooksAtom = atomWithRefresh(async (get) => {
  const profile = await get(profileAtom)
  const userId = profile?.id ?? ""
  const localList = await get(booksAtom(userId))
  return Maybe.Just(localList)
})

export const removeBookCacheAtom = atom(null, async (get, _, id: string) => {
  const difficulty = await get(userSettingsAtom("difficulty"))
  const cacheKey = `book-pagesv4-${difficulty}-${id}`
  logger.log("delete cache key", cacheKey)
  await ReaderDB.UserLocalSettings.delete(cacheKey)
})

export const removeBookAtom = atom(null, async (get, _set, id: string) => {
  await _set(removeBookCacheAtom, id)

  const profile = await get(profileAtom)
  const userId = profile?.id ?? ""
  const log = await createUserLog(
    LogType.Books,
    {
      op: 1,
      book: { id } as LibraryItem,
    },
    userId
  )
  await _set(appendUserLogAtom, log)
})
