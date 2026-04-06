import { LangShorts } from "@pmate/meta"
import i18n from "i18next"
import {
  I18nextProvider,
  initReactI18next,
  useTranslation as useI18nTranslation,
} from "react-i18next"
import arSA from "./res/ar-SA.json"
import deDE from "./res/de-DE.json"
import elGR from "./res/el-GR.json"
import en from "./res/en.json"
import esES from "./res/es-ES.json"
import fiFI from "./res/fi-FI.json"
import filPH from "./res/fil-PH.json"
import frFR from "./res/fr-FR.json"
import hiIN from "./res/hi-IN.json"
import jaJP from "./res/ja-JP.json"
import koKR from "./res/ko-KR.json"
import ptBR from "./res/pt-BR.json"
import ptPT from "./res/pt-PT.json"
import ruRU from "./res/ru-RU.json"
import taIN from "./res/ta-IN.json"
import ukUA from "./res/uk-UA.json"
import zhCN from "./res/zh-CN.json"
import zhTW from "./res/zh-TW.json"

i18n.use(initReactI18next).init({
  resources: {
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
  },
  supportedLngs: Array.from(LangShorts),
  fallbackLng: "zh-CN",
  interpolation: { escapeValue: false },
})

export { i18n, I18nextProvider }
export const useTranslation = () => useI18nTranslation().t
