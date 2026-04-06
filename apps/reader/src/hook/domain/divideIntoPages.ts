import { Difficulty, Page, ReadingBook } from "@pmate/meta"
import { last } from "lodash"
import { chunkByCondition } from "./chunkByCondition"

export function divideIntoPages(book: ReadingBook, difficulty: Difficulty) {
  const pages: Page[] = []
  const paragraphs = book.paragraphs

  let pid = 0
  const chunks = chunkByCondition(paragraphs, (chunk, item) => {
    const lastParagraph = last(chunk)
    if (lastParagraph) {
      if (
        chunk.reduce((acc, x) => acc + x.words.length, 0) + item.words.length >
        difficulty
      ) {
        return true
      }
      return false
    }
    return false
  })

  for (const list of chunks) {
    pages.push({
      paragraphs: list,
      index: pid++,
    })
  }

  return pages
}
