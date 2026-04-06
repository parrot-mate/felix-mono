import {
  type LangShort,
  type ParagraphExplainParams,
  type ReadingBook,
  type ReadingParagraph,
} from "@pmate/meta"
import { HashType, Logger, uniqHash } from "@pmate/utils"

const logger = Logger.getDebugger("getParagraphExplainParams")
function neighborsOf<T>(arr: T[], index: number, radius: number): T[] {
  const start = Math.max(0, index - radius)
  const end = Math.min(arr.length, index + radius + 1)
  return arr.slice(start, end)
}

export const getParagraphExplainParams = (
  paragraph: ReadingParagraph,
  book: ReadingBook,
  userLang?: LangShort
) => {
  const paragraphs = neighborsOf(book.paragraphs, paragraph.index, 10)
  const all = paragraphs
    .map((p) =>
      p.sentences.map((s) => {
        return {
          sentence: s,
          isCurrent: p.index === paragraph.index,
        }
      })
    )
    .flat()
    .map((x, i) => {
      return {
        ...x,
        index: i,
      }
    })
  const allSentences = all.map((x) => x.sentence)
  const params = all
    .filter((x) => x.isCurrent)
    .map((s) => {
      const param = {
        sentences: allSentences,
        title: book.title,
        index: s.index,
        hash: "",
        lang: book.lang || "en",
        userLang,
      }
      const hash = uniqHash(param, HashType.JSON)
      param.hash = hash
      return param as ParagraphExplainParams
    })
  return params
}
