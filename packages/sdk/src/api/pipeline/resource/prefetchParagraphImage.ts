import type { ReadingBook } from "@pmate/meta"
import { aiGenImage } from "./aiGenImage"
import { getParagraphImageParams } from "./getParagraphImageParams"

export const prefetchParagraphImage = async (
  book: ReadingBook,
  pid: number
) => {
  for (let i = pid; i < pid + 20; i++) {
    const req = getParagraphImageParams(book, i)
    aiGenImage(req)
  }
}
