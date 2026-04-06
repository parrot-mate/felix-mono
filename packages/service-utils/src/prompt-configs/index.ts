import { Prompt } from "@pmate/meta"

import bookCoverPrompt from "./book-cover-prompt.prompt"
import contextExplainCnCn from "./zh-CN/zh-CN/context-explain.prompt"
import contextExplainCnEn from "./zh-CN/en/context-explain.prompt"
import contextExplainEnCn from "./en/zh-CN/context-explain.prompt"
import contextExplainEnEn from "./en/en/context-explain.prompt"
import contextExplainKrCn from "./ko-KR/zh-CN/context-explain.prompt"
import contextExplainKrEn from "./ko-KR/en/context-explain.prompt"
import contextImagePrompt from "./context-image-prompt.prompt"
import contextQuestionCnCN from "./zh-CN/zh-CN/context-question.prompt"
import contextQuestionCnEn from "./zh-CN/en/context-question.prompt"
import contextQuestionEnCn from "./en/zh-CN/context-question.prompt"
import contextQuestionEnEn from "./en/en/context-question.prompt"
import contextQuestionKrCn from "./ko-KR/zh-CN/context-question.prompt"
import contextQuestionKrEn from "./ko-KR/en/context-question.prompt"
import contextWordsCnCn from "./zh-CN/zh-CN/context-words.prompt"
import contextWordsCnEn from "./zh-CN/en/context-words.prompt"
import contextWordsEnCn from "./en/zh-CN/context-words.prompt"
import contextWordsEnEn from "./en/en/context-words.prompt"
import contextWordsKrCn from "./ko-KR/zh-CN/context-words.prompt"
import contextWordsKrEn from "./ko-KR/en/context-words.prompt"
import revisePrompt from "./revise.prompt"
import translationPrompt from "./translation.prompt"
import wordCnCn from "./zh-CN/zh-CN/word.prompt"
import wordCnEn from "./zh-CN/en/word.prompt"
import wordEnCn from "./en/zh-CN/word.prompt"
import wordEnEn from "./en/en/word.prompt"
import wordImagePrompt from "./word-image-prompt.prompt"
import wordKrCn from "./ko-KR/zh-CN/word.prompt"
import wordKrEn from "./ko-KR/en/word.prompt"

const promptList: Prompt[] = [
  wordEnEn,
  wordEnCn,
  wordCnCn,
  wordCnEn,
  wordKrEn,
  wordKrCn,
  contextWordsCnEn,
  contextWordsEnCn,
  contextWordsCnCn,
  contextWordsEnEn,
  contextWordsKrEn,
  contextWordsKrCn,
  contextQuestionCnEn,
  contextQuestionEnCn,
  contextQuestionEnEn,
  contextQuestionKrCn,
  contextQuestionKrEn,
  contextQuestionCnCN,
  contextExplainEnCn,
  contextExplainEnEn,
  contextExplainCnEn,
  contextExplainCnCn,
  contextExplainKrEn,
  contextExplainKrCn,
  wordImagePrompt,
  bookCoverPrompt,
  contextImagePrompt,
  revisePrompt,
  translationPrompt,
]

export const Prompts: Prompt[] = promptList

export const PromptRecord: Record<string, Prompt> = promptList.reduce(
  (acc, prompt) => {
    acc[prompt.key] = prompt
    return acc
  },
  {} as Record<string, Prompt>
)
