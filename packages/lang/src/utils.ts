import { Langs, type LangFull, type LangShort } from "@pmate/meta"

const LEGACY_MAP: Record<string, LangShort> = {
  cn: "zh-CN",
  zh: "zh-CN",
  "zh-cn": "zh-CN",
  zh_cn: "zh-CN",
  tw: "zh-TW",
  "zh-tw": "zh-TW",
  kr: "ko-KR",
  ko: "ko-KR",
  jp: "ja-JP",
  ja: "ja-JP",
  de: "de-DE",
  fr: "fr-FR",
  es: "es-ES",
  sp: "es-ES",
  ar: "ar-SA",
  ru: "ru-RU",
  pt: "pt-PT",
  "pt-br": "pt-BR",
  pt_br: "pt-BR",
  "pt-pt": "pt-PT",
  pt_pt: "pt-PT",
  fi: "fi-FI",
  el: "el-GR",
  hi: "hi-IN",
  ta: "ta-IN",
  uk: "uk-UA",
  ua: "uk-UA",
  fil: "fil-PH",
  "en-us": "en",
  "en-gb": "en",
}

export const legacyLangMap = LEGACY_MAP

export function normalizeLang(
  lang?: string | null,
  fallback: LangShort = "zh-CN",
): LangShort {
  if (!lang) return fallback
  const direct = Langs.find((entry) => entry.short === lang)
  if (direct) return direct.short

  const lower = lang.toLowerCase()
  const mapped = LEGACY_MAP[lower]
  if (mapped) return mapped

  if (lower.startsWith("zh")) return "zh-CN"
  if (lower.startsWith("ko")) return "ko-KR"
  if (lower.startsWith("ja")) return "ja-JP"
  if (lower.startsWith("es")) return "es-ES"
  if (lower.startsWith("fr")) return "fr-FR"
  if (lower.startsWith("de")) return "de-DE"

  return fallback
}

export const isNicknameValid = (nick: string, lang: LangShort): boolean => {
  if (!nick) return false
  switch (lang) {
    case "zh-CN":
    case "zh-TW":
      return /^[\u4e00-\u9fff]+$/.test(nick)
    case "ko-KR":
      return /^[\u3130-\u318F\uAC00-\uD7A3]+$/.test(nick)
    case "es-ES":
      return /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+$/.test(nick)
    default:
      return /^[A-Za-z]+$/.test(nick)
  }
}

export const getLangFull = (short: LangShort): LangFull => {
  const found = Langs.find((l) => l.short === short)
  return (found?.full ?? short) as LangFull
}
