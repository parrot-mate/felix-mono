import { Logger } from "@pmate/utils"
import type {
  LangShort,
  ParagraphExplainParams,
  ReadingBook,
  ReadingParagraph,
} from "@pmate/meta"
import {
  resolveSentenceExplainPromptKey,
  resolveWordsExplainPromptKey,
} from "@sdk/util/promptUtils"
import { runPrompt } from "@sdk/api/pipeline/runPrompt"
import { getParagraphExplainParams } from "./getParagraphExplainParams"

const logger = Logger.getDebugger("aiGenSentenceExplain")

export const prepareSentenceExplain = async (param: ParagraphExplainParams) => {
  if (!param) {
    return null
  }

  const { sentences, index, title } = param
  if (!sentences[index]) {
    return null
  }

  try {
    const contextLang = param.lang
    const userLang = param.userLang
    const explainKey = resolveSentenceExplainPromptKey(contextLang, userLang)
    const wordsKey = resolveWordsExplainPromptKey(contextLang, userLang)

    const explainFeilds = {
      context: sentences.join("\n"),
      sentence: sentences[index],
    }

    const wordsFeilds = {
      title: title,
      sentence: sentences[index],
    }

    await Promise.all([
      runPrompt(explainKey, explainFeilds),
      runPrompt(wordsKey, wordsFeilds),
      runPrompt("reader/en/zh-CN/grammar", {
        sentence: sentences[index],
      }),
    ])
  } catch (ex) {
    console.error(ex)
    return null
  }
}

export const preloadBookSentenceExplain = async (
  book: ReadingBook,
  paragraph: ReadingParagraph,
  userLang: LangShort
) => {
  const params = getParagraphExplainParams(paragraph, book, userLang)
  await Promise.all(params.map((param) => prepareSentenceExplain(param)))
}
