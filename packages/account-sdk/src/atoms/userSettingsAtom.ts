import { VoiceList } from "@pmate/meta"
import { Difficulty, UserSettings } from "@pmate/meta"
import { WritableAtom, atom } from "jotai"
import { LSKEYS, localStorageJsonAtom } from "./localStorageAtom"

const defaultSettings: UserSettings = {
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
}

const settingsCache = new Map<keyof UserSettings, WritableAtom<any, any, any>>()

export const userSettingsAtom = <T extends keyof UserSettings>(key: T) => {
  if (settingsCache.has(key)) {
    return settingsCache.get(key)! as WritableAtom<
      UserSettings[T],
      [value: UserSettings[T]],
      void
    >
  }

  const settingAtom = atom(
    (get) => {
      const stored = get(localStorageJsonAtom(LSKEYS.USER_SETTINGS)) as
        | UserSettings
        | null
      if (stored && key in stored) {
        return stored[key] as UserSettings[T]
      }
      return defaultSettings[key]
    },
    (get, set, value: UserSettings[T]) => {
      const stored = get(localStorageJsonAtom(LSKEYS.USER_SETTINGS)) as
        | UserSettings
        | null
      const next = {
        ...(stored ?? defaultSettings),
        [key]: value,
      } as UserSettings
      set(localStorageJsonAtom(LSKEYS.USER_SETTINGS), next)
    }
  )

  settingsCache.set(key, settingAtom)
  return settingAtom as WritableAtom<UserSettings[T], [value: UserSettings[T]], void>
}
