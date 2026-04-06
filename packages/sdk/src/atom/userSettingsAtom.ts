import { VoiceList } from "@pmate/meta"
import {
  Difficulty,
  LogType,
  Updator,
  UserLocalSettings,
  UserSettings,
} from "@pmate/meta"
import { Logger } from "@pmate/utils"
import { WritableAtom, atom } from "jotai"
import { unwrap } from "jotai/utils"
import { createUserLog } from "@sdk/indexer/UserLogIndexer"
import { aggregatorAtom } from "./aggregatorAtom"
import { profileAtom } from "@pmate/account-sdk"
import { appendUserLogAtom } from "./appendUserLogAtom"
import { LSKEYS, localStorageJsonAtom } from "./localStorageAtom"

const logger = Logger.getDebugger("userSettingsAtom")
const FONT_SIZE = window.innerWidth > 800 ? 24 : 16
const defaultLocalSettings: UserLocalSettings = {
  fontSize: FONT_SIZE,
}

const userLocalSettingsAtom = atom(
  (get) => {
    return (
      (get(
        localStorageJsonAtom(LSKEYS.USER_SETTINGS)
      ) as UserLocalSettings | null) || defaultLocalSettings
    )
  },
  (_, set, newSettings: UserLocalSettings | Updator<UserLocalSettings>) => {
    set(localStorageJsonAtom(LSKEYS.USER_SETTINGS), newSettings)
  }
)

export const userFontSizeAtom = atom((get) => {
  const fz = get(userLocalSettingsAtom).fontSize
  return fz
})

export const setFontSizeAtom = atom(
  null,
  (get, set, newFontSize: number | Updator<number>) => {
    const settings = get(userLocalSettingsAtom)
    if (typeof newFontSize === "function") {
      set(userLocalSettingsAtom, {
        ...settings,
        fontSize: newFontSize(settings.fontSize),
      })
    } else {
      set(userLocalSettingsAtom, { ...settings, fontSize: newFontSize })
    }
  }
)

const defaultSettings = {
  intensive: false,
  bilingual: true,
  fontColor: "#000000",
  backgroundColor: "white",
  books: [],
  advancedMode: false,
  autoread: true,
  playSpeed: 1,
  scrollDirection: "vertical",
  companion: "",
  difficulty: Difficulty.Medium,
  "chatVoice@v2": VoiceList.KOKORO_af_alloy,
  uiLang: "zh-CN",
  motherTongue: "zh-CN",
} as const satisfies UserSettings

export const userSettingsVersion = atom(0)
const map = new Map()
export const userSettingsAtom = <T extends keyof UserSettings>(key: T) => {
  if (map.has(key)) {
    return map.get(key)! as WritableAtom<
      Promise<UserSettings[T]>,
      [value: UserSettings[T]],
      Promise<void>
    >
  }

  const readAtom = unwrap(
    atom(async (get) => {
      get(userSettingsVersion)
      const profile = await get(profileAtom)
      const userId = profile?.id ?? ""
      const agg = await get(aggregatorAtom(userId))
      const settingsVal = agg.settings[key]
      logger.log(`read user settings ${key}`, settingsVal)
      if (settingsVal === undefined) {
        return defaultSettings[key] as UserSettings[T]
      }
      return settingsVal as UserSettings[T]
    }),
    (prev) => {
      return prev || defaultSettings[key]
    }
  )
  const cached = atom(
    (get) => {
      return get(readAtom)
    },
    async (get, set, value: UserSettings[T]) => {
      const profile = await get(profileAtom)
      const userId = profile?.id ?? ""
      const log = await createUserLog(
        LogType.UserSettings,
        { key, value },
        userId
      )
      await set(appendUserLogAtom, log)
      set(userSettingsVersion, (v) => v + 1)
    }
  )
  map.set(key, cached)
  return cached as WritableAtom<
    Promise<UserSettings[T]>,
    [value: UserSettings[T]],
    Promise<void>
  >
}
