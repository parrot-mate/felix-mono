import type { ReadingBook } from "@pmate/meta"

export const aiGenParagraphStr = (book: ReadingBook, pid: number) => {
  const paragraphs = book.paragraphs
  const p = paragraphs
    .slice(pid, pid + 10)
    .map((x) => x.content)
    .join(" ")
  return p
}
