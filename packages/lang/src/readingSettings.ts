import type { LangShort } from "@pmate/meta"
import { splitSentence as splitSentenceCN } from "./cn/sentenceSpliter"
import { wordSpliter as wordSpliterCN } from "./cn/wordSpliter"
import { splitSentence as splitSentenceEN } from "./en/sentenceSpliter"
import { wordSpliter as wordSpliterEN } from "./en/wordSpliter"
import { splitSentence as splitSentenceKR } from "./kr/sentenceSpliter"
import { wordSpliter as wordSpliterKR } from "./kr/wordSpliter"

export interface LangReadingSetting {
  isSupportWordDict: boolean
  sentenceSpliter: (str: string) => string[]
  wordSpliter: (str: string) => string[]
}

const englishSetting: LangReadingSetting = {
  isSupportWordDict: true,
  sentenceSpliter: splitSentenceEN,
  wordSpliter: wordSpliterEN,
}

const chineseSetting: LangReadingSetting = {
  isSupportWordDict: false,
  sentenceSpliter: splitSentenceCN,
  wordSpliter: wordSpliterCN,
}

const koreanSetting: LangReadingSetting = {
  isSupportWordDict: true,
  sentenceSpliter: splitSentenceKR,
  wordSpliter: wordSpliterKR,
}

export const LangReadingSettings: Record<LangShort, LangReadingSetting> = {
  en: englishSetting,
  "zh-CN": chineseSetting,
  "zh-TW": chineseSetting,
  "ko-KR": koreanSetting,
  "es-ES": englishSetting,
  "fr-FR": englishSetting,
  "ja-JP": englishSetting,
  "de-DE": englishSetting,
  "ar-SA": englishSetting,
  "el-GR": englishSetting,
  "fi-FI": englishSetting,
  "fil-PH": englishSetting,
  "hi-IN": englishSetting,
  "pt-BR": englishSetting,
  "pt-PT": englishSetting,
  "ru-RU": englishSetting,
  "ta-IN": englishSetting,
  "uk-UA": englishSetting,
}

export function getLangReadingSetting(
  lang: LangShort = "en"
): LangReadingSetting {
  if (lang.startsWith("zh")) {
    return LangReadingSettings["zh-CN"]
  }
  return LangReadingSettings[lang] || LangReadingSettings["en"]
}
