export const LangShorts = [
  "en",
  "zh-CN",
  "zh-TW",
  "ko-KR",
  "es-ES",
  "fr-FR",
  "ja-JP",
  "de-DE",
  "ar-SA",
  "el-GR",
  "fi-FI",
  "fil-PH",
  "hi-IN",
  "pt-BR",
  "pt-PT",
  "ru-RU",
  "ta-IN",
  "uk-UA",
] as const

export type LangShort = (typeof LangShorts)[number]

export const LangLongs = [
  "English",
  "Chinese (Simplified)",
  "Chinese (Traditional)",
  "Korean",
  "Spanish",
  "French",
  "Japanese",
  "German",
  "Arabic",
  "Greek",
  "Finnish",
  "Filipino",
  "Hindi",
  "Portuguese (Brazil)",
  "Portuguese (Portugal)",
  "Russian",
  "Tamil",
  "Ukrainian",
] as const

export type LangLong = (typeof LangLongs)[number]

export const Langs = [
  { short: "en", full: "English" },
  { short: "zh-CN", full: "Chinese (Simplified)" },
  { short: "zh-TW", full: "Chinese (Traditional)" },
  { short: "ko-KR", full: "Korean" },
  { short: "es-ES", full: "Spanish" },
  { short: "fr-FR", full: "French" },
  { short: "ja-JP", full: "Japanese" },
  { short: "de-DE", full: "German" },
  { short: "ar-SA", full: "Arabic" },
  { short: "el-GR", full: "Greek" },
  { short: "fi-FI", full: "Finnish" },
  { short: "fil-PH", full: "Filipino" },
  { short: "hi-IN", full: "Hindi" },
  { short: "pt-BR", full: "Portuguese (Brazil)" },
  { short: "pt-PT", full: "Portuguese (Portugal)" },
  { short: "ru-RU", full: "Russian" },
  { short: "ta-IN", full: "Tamil" },
  { short: "uk-UA", full: "Ukrainian" },
] as const

export type LangFull = (typeof Langs)[number]["full"]
