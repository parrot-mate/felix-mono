import type {
  LangShort,
  ParagraphExplainParams,
  PromptKeys,
} from "@pmate/meta"

type SentencePromptVariables = {
  context: string
  sentence: string
}

type WordsPromptVariables = {
  title: string
  sentence: string
}

type ContextWordsPromptKey = Extract<
  PromptKeys,
  `reader/${string}/${string}/context-words`
>

const ensureLang = (lang: LangShort | undefined, label: string): LangShort => {
  if (!lang) {
    throw new Error(`${label} is required to resolve prompt key`)
  }
  return lang
}

export const resolveSentenceExplainPromptKey = (
  lang: LangShort,
  userLang: LangShort
): PromptKeys => {
  if (lang === "en" && userLang === "zh-CN") {
    return `reader/${lang}/${userLang}/context-explain-v2` as PromptKeys
  }
  return `reader/${lang}/${userLang}/context-explain` as PromptKeys
}

export const resolveWordsExplainPromptKey = (
  lang: LangShort,
  userLang: LangShort
): ContextWordsPromptKey =>
  `reader/${lang}/${userLang}/context-words` as ContextWordsPromptKey

type SentencePromptOptions = {
  fallbackSentence?: string
  userLang?: LangShort
}

type WordsPromptOptions = {
  sentenceOverride?: string
  userLang?: LangShort
}

export const paragraphExplainParamsToPrompt = (
  params: ParagraphExplainParams,
  options: SentencePromptOptions = {}
) => {
  const lang = params.lang
  const userLang = ensureLang(options.userLang ?? params.userLang, "userLang")

  const sentence =
    params.sentences[params.index] ?? options.fallbackSentence ?? ""

  return {
    promptKey: resolveSentenceExplainPromptKey(lang, userLang),
    variables: {
      context: params.sentences.join("\n"),
      sentence,
    } as SentencePromptVariables,
  }
}

export const paragraphExplainParamsToWordsPrompt = (
  params: ParagraphExplainParams,
  options: WordsPromptOptions = {}
) => {
  const lang = params.lang
  const userLang = ensureLang(options.userLang ?? params.userLang, "userLang")

  const sentence =
    options.sentenceOverride ?? params.sentences[params.index] ?? ""

  return {
    promptKey: resolveWordsExplainPromptKey(lang, userLang),
    variables: {
      title: params.title,
      sentence,
    } as WordsPromptVariables,
  }
}
