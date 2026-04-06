import type { LangShort } from "./lang.types"
import type { AIImgRequest, AIImgType, AudioTaskInit } from "./aigen.types"
import type { ParagraphExplainParams } from "./reading.types"

export enum OfflineCacheType {
  Word,
  SentenceAnalyze,
  Audio,
  Image,
  Translation,
}

export type OfflineCacheParams = {
  [OfflineCacheType.Image]: AIImgRequest<AIImgType>
  [OfflineCacheType.Audio]: AudioTaskInit
  [OfflineCacheType.SentenceAnalyze]: ParagraphExplainParams
  [OfflineCacheType.Word]: {
    word: string
    lang: LangShort
    userLang: LangShort
  }
  [OfflineCacheType.Translation]: {
    langSource: LangShort
    langTarget: LangShort
    text: string
    context?: string
  }
}

export type OfflineCacheItem = {
  hash: string
  data: any
}
