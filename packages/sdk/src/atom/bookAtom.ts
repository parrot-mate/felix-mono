import { atom } from "jotai"
import { atomFamily, atomWithRefresh } from "jotai/utils"
import { Logger, Maybe, mapToReadingBook, txtToBook } from "@pmate/utils"
import type { Book, Difficulty, ReadingBook } from "@pmate/meta"

import { Api } from "@sdk/api/Api"
import { divideIntoPages } from "@sdk/util/divideIntoPages"
import { ReaderDB } from "@sdk/util/ReaderDB"
import { divideIntoParagraphs } from "@sdk/util/divideIntoParagraphs"
import { booksAtom } from "./booksAtom"
import { notesBookAtom } from "./notesBookAtom"
import { libraryItemAtom } from "./libraryItemAtom"
import { profileAtom } from "@pmate/account-sdk"
import { userSettingsAtom } from "./userSettingsAtom"

const logger = Logger.getDebugger("bookAtom")

export const bookAtom = atomFamily((id: string) => {
  const bookRawAtom = atom(async (get) => {
    const profile = await get(profileAtom)
    const userId = profile?.id ?? ""
    if (!userId) {
      return Maybe.Nothing()
    }

    const notes = await get(notesBookAtom(userId))
    const note = notes.find((x) => x.id === id)
    if (note) {
      return Maybe.Just(note)
    }

    const libraryItems = await get(libraryItemAtom)
    const localBooks = await get(booksAtom(userId))
    const item = await libraryItems.mapAsync(async (items) => {
      const remoteItem = items.find((entry) => entry.id === id)
      if (remoteItem) {
        return remoteItem
      }

      const localItem = localBooks.find((book) => book.id === id)
      return localItem ? Maybe.Just(localItem) : Maybe.Nothing()
    })

    const bookData = await item.mapAsync(async (entry) => {
      logger.log("item", entry)
      if (entry.type === "local-txt") {
        let text: string
        if (entry.link) {
          text = await fetch(entry.link).then((response) => response.text())
        } else {
          const data = (await ReaderDB.DataDb.get(entry.id)).unwrap() as string
          text = data
        }
        const serialized = txtToBook(entry.title!.en, text)
        return Maybe.Just(serialized)
      } else if (entry.type === "remote-json") {
        const book = await Api.getFile<Book>(entry.link!)

        logger.log("json", entry.link, book)
        if (!book) {
          logger.error("Failed to fetch book data", entry.link, book)
          return Maybe.Nothing()
        }
        return Maybe.Just(book)
      } else {
        const data = (await ReaderDB.DataDb.get(entry.id)).unwrap()
        return Maybe.Just(data as Book)
      }
    })
    return bookData.mapWith(item, (book, libraryItem) => {
      const paragraphs = divideIntoParagraphs(book)
      return mapToReadingBook(libraryItem, book, paragraphs)
    })
  })

  function addingData(difficulty: Difficulty, book: Maybe<ReadingBook>) {
    return book.map((readingBook) => {
      const pages = divideIntoPages(readingBook, difficulty)
      readingBook.punchPages = pages
      readingBook.paragraphsPageMap = new Map()
      for (const punch of readingBook.punchPages) {
        for (const paragraph of punch.paragraphs) {
          readingBook.paragraphsPageMap.set(paragraph.index, punch.index)
        }
      }
      readingBook.wc = readingBook.paragraphs.reduce(
        (acc, paragraph) => acc + paragraph.words.length,
        0
      )
      readingBook.sc = readingBook.paragraphs.reduce(
        (acc, paragraph) => acc + paragraph.sentences.length,
        0
      )
      const uniqWords = new Set<string>()
      for (const paragraph of readingBook.paragraphs) {
        for (const word of paragraph.words) {
          uniqWords.add(word)
        }
      }
      readingBook.uniqWc = uniqWords.size
      readingBook.chapterCount = readingBook.paragraphs.filter(
        (paragraph) => paragraph.chapterTitle
      ).length
      return readingBook
    })
  }

  return atomWithRefresh(async (get) => {
    const difficulty = await get(userSettingsAtom("difficulty"))
    const cacheKey = `book-pagesv4-${difficulty}-${id}`
    const cached = await ReaderDB.UserLocalSettings.get(cacheKey)
    if (cached.isJust() && id !== "_notes") {
      return cached as Maybe<ReadingBook>
    }

    const book = addingData(difficulty, await get(bookRawAtom))
    await ReaderDB.UserLocalSettings.save(cacheKey, book)
    return book
  })
})
