import type { Difficulty, Page, ReadingBook } from "@pmate/meta"
import { last } from "lodash"

import { chunkByCondition } from "./chunkByCondition"

export function divideIntoPages(
  book: ReadingBook,
  difficulty: Difficulty
): Page[] {
  const pages: Page[] = []
  const paragraphs = book.paragraphs

  let pid = 0
  const chunks = chunkByCondition(paragraphs, (chunk, item) => {
    const lastParagraph = last(chunk)
    if (lastParagraph) {
      const wordsInChunk = chunk.reduce(
        (acc, paragraph) => acc + paragraph.words.length,
        0
      )
      if (wordsInChunk + item.words.length > difficulty) {
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
