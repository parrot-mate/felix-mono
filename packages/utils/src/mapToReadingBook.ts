import type { Book, LibraryItem, ReadingBook, ReadingParagraph } from "@pmate/meta"

export function mapToReadingBook(
  item: LibraryItem,
  book: Book,
  paragraphs: ReadingParagraph[]
) {
  return {
    id: item.id,
    title: item.title?.en || "",
    author: item.author || "",
    lang: book.lang || "en",
    intro: item.intro || "",
    paragraphs: paragraphs,
    punches: [],
    paragraphsPageMap: new Map(),
    punchPages: [],
    wc: 0,
    sc: 0,
    uniqWc: 0,
    chapterCount: 0,
  } as ReadingBook
}
