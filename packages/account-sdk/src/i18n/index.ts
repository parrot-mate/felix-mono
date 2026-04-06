import i18next from "i18next"
import {
  I18nextProvider,
  initReactI18next,
  useTranslation as useI18nTranslation,
} from "react-i18next"
import arSA from "../locales/ar-SA.json"
import deDE from "../locales/de-DE.json"
import elGR from "../locales/el-GR.json"
import en from "../locales/en.json"
import esES from "../locales/es-ES.json"
import fiFI from "../locales/fi-FI.json"
import filPH from "../locales/fil-PH.json"
import frFR from "../locales/fr-FR.json"
import hiIN from "../locales/hi-IN.json"
import jaJP from "../locales/ja-JP.json"
import koKR from "../locales/ko-KR.json"
import ptBR from "../locales/pt-BR.json"
import ptPT from "../locales/pt-PT.json"
import ruRU from "../locales/ru-RU.json"
import taIN from "../locales/ta-IN.json"
import ukUA from "../locales/uk-UA.json"
import zhCN from "../locales/zh-CN.json"
import zhTW from "../locales/zh-TW.json"

const resources = {
  en: { translation: en },
  "ar-SA": { translation: arSA },
  "de-DE": { translation: deDE },
  "el-GR": { translation: elGR },
  "es-ES": { translation: esES },
  "fi-FI": { translation: fiFI },
  "fil-PH": { translation: filPH },
  "fr-FR": { translation: frFR },
  "hi-IN": { translation: hiIN },
  "ja-JP": { translation: jaJP },
  "ko-KR": { translation: koKR },
  "pt-BR": { translation: ptBR },
  "pt-PT": { translation: ptPT },
  "ru-RU": { translation: ruRU },
  "ta-IN": { translation: taIN },
  "uk-UA": { translation: ukUA },
  "zh-CN": { translation: zhCN },
  "zh-TW": { translation: zhTW },
} as const

const supportedLngs = Object.keys(resources)

const i18n = i18next.createInstance()
i18n.use(initReactI18next).init({
  resources,
  supportedLngs,
  lng: "zh-CN",
  fallbackLng: "zh-CN",
  interpolation: { escapeValue: false },
})

export { i18n, I18nextProvider }
export const useTranslation = () => useI18nTranslation().t
