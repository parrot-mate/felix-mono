export enum PromptFieldType {
  Text = "text",
  Number = "number",
  Select = "select",
  MultiSelect = "multi-select",
  Date = "date",
  Language = "language",
}

export enum ModelType {
  Chat = "chat",
  TTS = "tts",
}

export enum ModelNames {
  DoubaoThinkingPro = "doubao-1-5-thinking-pro-250415",
  Ep20250515004555M6dgx = "ep-20250515004555-m6dgx",
  DeepseekChat = "deepseek-chat",
  Gpt4oMini = "gpt-4o-mini",
  Gpt4o = "gpt-4o",
  O1Preview = "o1-preview",
  Gpt41 = "gpt-4.1",
  Gpt5Mini = "gpt-5-mini",
  Gpt5Nano = "gpt-5-nano",
}

export type PromptVariable = {
  type: PromptFieldType
  name: string
  description?: string
  /**
   * Indicates whether the variable must be provided when executing the prompt.
   * Defaults to true to preserve existing behaviour.
   */
  required?: boolean
}

export type PromptMessage = {
  role: "user" | "system"
  content: string
}

export type Prompt = {
  key: string
  title: string
  model: string
  messages: PromptMessage[]
  variables: PromptVariable[]
  resultType: "json" | "text"
  caching: boolean
  version: number
}

export interface PromptBilingualPair {
  from: string
  to: string
}

export interface PromptTermExplain {
  term: string
  explain: string
}

export type SyntaxNodeType =
  | "S"
  | "SBAR"
  | "NP"
  | "VP"
  | "PP"
  | "ADJP"
  | "ADVP"
  | "PRT"
  | "CONJP"
  | "INTJ"
  | "FRAG"
  | "NOUN"
  | "PRON"
  | "VERB"
  | "AUX"
  | "ADJ"
  | "ADV"
  | "ADP"
  | "DET"
  | "NUM"
  | "PART"
  | "CONJ"
  | "SCONJ"
  | "INT"
  | "PUNCT"
  | "SYM"
  | "X"
  | "ROOT"
  | "CLAUSE"
  | "PHRASE"

export interface SyntaxNode {
  type: SyntaxNodeType
  text: string
  children?: SyntaxNode[]
  note?: string
}

export interface GrammarTree {
  root: SyntaxNode
}

export interface PromptContextExplain {
  bilingualPairs: PromptBilingualPair[]
  interpretation: string
  keyAndDifficultTerms: PromptTermExplain[]
  grammar?: GrammarTree
}

export interface PromptReviseResult {
  revised: string
}

export interface PromptTranslationResult {
  translation: string
}

export interface PromptIllustrationResult {
  illustration: string
}

export interface PromptAnswerResult {
  answer: string
}

export interface PromptPhraseExplainItem {
  wordOrPhrase: string
  explain: string
}

export interface PromptPhraseExplainResult {
  list: PromptPhraseExplainItem[]
}

export interface PromptMeaningResult {
  meaning: string
}

export type PromptKeys =
  | "chat/revise"
  | "chat/translation"
  | "reader/book-cover"
  | "reader/context-image"
  | "reader/en/en/context-explain"
  | "reader/en/en/context-question"
  | "reader/en/en/context-words"
  | "reader/en/en/word"
  | "reader/en/zh-CN/context-explain"
  | "reader/en/zh-CN/context-explain-v2"
  | "reader/en/zh-CN/grammar"
  | "reader/en/zh-CN/context-question"
  | "reader/en/zh-CN/context-words"
  | "reader/en/zh-CN/word"
  | "reader/ko-KR/en/context-explain"
  | "reader/ko-KR/en/context-question"
  | "reader/ko-KR/en/context-words"
  | "reader/ko-KR/en/word"
  | "reader/ko-KR/zh-CN/context-explain"
  | "reader/ko-KR/zh-CN/context-question"
  | "reader/ko-KR/zh-CN/context-words"
  | "reader/ko-KR/zh-CN/word"
  | "reader/word-image"
  | "reader/zh-CN/en/context-explain"
  | "reader/zh-CN/en/context-question"
  | "reader/zh-CN/en/context-words"
  | "reader/zh-CN/en/word"
  | "reader/zh-CN/zh-CN/context-explain"
  | "reader/zh-CN/zh-CN/context-question"
  | "reader/zh-CN/zh-CN/context-words"
  | "reader/zh-CN/zh-CN/word"

export type Model = {
  apiKey: string
  type: ModelType
  key: string
  endpoint: string
}

export interface RunPromptParams {
  type: PromptKeys
  variables: Record<string, any>
}

export type PromptReturnRawTypeMap = {
  "chat/revise": PromptReviseResult
  "chat/translation": PromptTranslationResult
  "reader/book-cover": PromptIllustrationResult
  "reader/context-image": PromptIllustrationResult
  "reader/en/en/context-explain": string
  "reader/en/en/context-question": PromptAnswerResult
  "reader/en/en/context-words": PromptPhraseExplainResult
  "reader/en/en/word": PromptMeaningResult
  "reader/en/zh-CN/context-explain": string
  "reader/en/zh-CN/context-explain-v2": PromptContextExplain
  "reader/en/zh-CN/grammar": GrammarTree
  "reader/en/zh-CN/context-question": PromptAnswerResult
  "reader/en/zh-CN/context-words": PromptPhraseExplainResult
  "reader/en/zh-CN/word": PromptMeaningResult
  "reader/ko-KR/en/context-explain": string
  "reader/ko-KR/en/context-question": PromptAnswerResult
  "reader/ko-KR/en/context-words": PromptPhraseExplainResult
  "reader/ko-KR/en/word": PromptMeaningResult
  "reader/ko-KR/zh-CN/context-explain": string
  "reader/ko-KR/zh-CN/context-question": PromptAnswerResult
  "reader/ko-KR/zh-CN/context-words": PromptPhraseExplainResult
  "reader/ko-KR/zh-CN/word": PromptMeaningResult
  "reader/word-image": PromptIllustrationResult
  "reader/zh-CN/en/context-explain": string
  "reader/zh-CN/en/context-question": PromptAnswerResult
  "reader/zh-CN/en/context-words": PromptPhraseExplainResult
  "reader/zh-CN/en/word": PromptMeaningResult
  "reader/zh-CN/zh-CN/context-explain": string
  "reader/zh-CN/zh-CN/context-question": PromptAnswerResult
  "reader/zh-CN/zh-CN/context-words": PromptPhraseExplainResult
  "reader/zh-CN/zh-CN/word": PromptMeaningResult
}

export type PromptReturnTypeTransform = {
  "reader/en/en/context-words": AIPhraseExplain[]
  "reader/en/zh-CN/context-words": AIPhraseExplain[]
  "reader/ko-KR/en/context-words": AIPhraseExplain[]
  "reader/ko-KR/zh-CN/context-words": AIPhraseExplain[]
  "reader/zh-CN/en/context-words": AIPhraseExplain[]
  "reader/zh-CN/zh-CN/context-words": AIPhraseExplain[]
}

export type PromptReturnTypeMap = {
  [K in PromptKeys]: K extends keyof PromptReturnTypeTransform
    ? PromptReturnTypeTransform[K] extends undefined
      ? PromptReturnRawTypeMap[K]
      : PromptReturnTypeTransform[K]
    : PromptReturnRawTypeMap[K]
}

export interface AIPhraseExplain {
  wordOrPhrase: string
  explain: string
}

export type SentenceExplain = {
  sentence: string
  explain: string
  words: AIPhraseExplain[]
}
