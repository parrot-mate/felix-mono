import { getLangReadingSetting } from "@pmate/lang"
import { Book, Paragraph, ReadingParagraph } from "@pmate/meta"

const MAX_LENGTH = 120
export function divideIntoParagraphs(book: Book) {
  const P: ReadingParagraph[] = []

  for (let chapter of book.chapters) {
    for (let i = 0; i < chapter.paragraphs.length; i++) {
      const paragraph = chapter.paragraphs[i]
      const chapterTitle = i === 0 ? chapter.title : ""
      const newPargraphs = divideParagraph(
        paragraph,
        chapterTitle,
        book.lang || "en"
      )
      for (let p of newPargraphs) {
        p.index = P.length
        P.push(p)
      }
    }
  }

  return P
}

function divideParagraph(
  paragraph: Paragraph,
  chapterTitle: string,
  lang: string
) {
  let text = ""
  let _slist: string[] = []
  const P: ReadingParagraph[] = []
  let paragraphIndex = 0

  const setting = getLangReadingSetting(lang as any)
  const sentences: string[] = setting.sentenceSpliter(paragraph.content)

  function createParagraph() {
    P.push({
      index: paragraphIndex++,
      chapterTitle,
      words: setting.wordSpliter(text),
      content: text,
      sentences: _slist.slice(),
    })
    chapterTitle = ""
    text = ""
    _slist = []
  }

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i]
    const nextSentence = sentences[i + 1] || ""
    text += sentence
    _slist.push(sentence)
    const nextLen = text.length + nextSentence.length
    if (text.length > 0 && nextLen > MAX_LENGTH) {
      createParagraph()
    }
  }
  if (text.length > 0) {
    createParagraph()
  }

  if (P.length > 0) {
    P[0].resource = paragraph.resources
  }
  return P
}
