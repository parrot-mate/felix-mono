import { HashType, mapToReadingBook, uniqHash } from "@pmate/utils"
import { Book, LibraryItem, ReadingBook } from "@pmate/meta"
import { atomFamily, atomWithRefresh } from "jotai/utils"
import { divideIntoParagraphs } from "@sdk/util/divideIntoParagraphs"
import { aggregatorAtom } from "./aggregatorAtom"

export const notesBookAtom = atomFamily((user: string) => {
  return atomWithRefresh(async (get) => {
    const agg = await get(aggregatorAtom(user))
    const notes = agg.notes

    const libItems = notes.map((note) => {
      const id = uniqHash(JSON.stringify(note), HashType.JSON)
      return {
        id,
        author: "",
        intro: "",
        title: { en: note.name, cn: note.name },
        type: "local-txt",
        data: note,
      } as LibraryItem
    })
    const books: ReadingBook[] = []

    for (const item of libItems) {
      const paragraphs = divideIntoParagraphs(item.data as Book)
      const redingBook = mapToReadingBook(
        item,
        item.data as Book,
        paragraphs
      )
      books.push(redingBook)
    }

    return books
  })
})