import { getLangReadingSetting } from "@pmate/lang"
import type { Book } from "@pmate/meta"

export const bookStats = (book: Book) => {
  const uniqWord = new Set<string>()
  let wordCount = 0
  let sentenceCount = 0
  let paragraphCount = 0
  const setting = getLangReadingSetting(book.lang || "en")
  for (let i = 0; i < book.chapters.length; i++) {
    const chapter = book.chapters[i]
    for (let j = 0; j < chapter.paragraphs.length; j++) {
      const paragraph = chapter.paragraphs[j]
      paragraphCount++
      const sentences = setting.sentenceSpliter(paragraph.content)
      const words = sentences.map((x) => setting.wordSpliter(x)).flat()
      wordCount += words.length
      sentenceCount += sentences.length
      words.forEach((word) => {
        uniqWord.add(word)
      })
    }
  }

  return {
    wordCount,
    uniqWords: uniqWord.size,
    words: Array.from(uniqWord),
    chapterCount: book.chapters.length,
    paragraphs: paragraphCount,
    sentences: sentenceCount,
  }
}
