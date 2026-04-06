import { ReaderDB } from "@pmate/sdk"
import { Logger } from "@pmate/utils"
import { UserLocalSettingsValue } from "@pmate/meta"
import { Maybe } from "@pmate/utils"
import { atom } from "jotai"
import { clone } from "lodash"
import { profileAtom } from "@pmate/account-sdk"
import { atomAsync } from "@/util/atomAsync"

type Action<T> = (val: T) => T

const logger = Logger.getDebugger("createLocalSettingsAtom")

export const createLocalSettingsAtom = <T extends UserLocalSettingsValue>(
  _key: string,
  defaultValue: T
) => {
  const versionAtom = atom(0)
  const combined = atomAsync(
    async (get) => {
      const profile = await get(profileAtom)
      const userId = profile?.id ?? ""
      if (!userId) {
        return Maybe.Nothing()
      }
      const key = `${userId}@${_key}`
      get(versionAtom)
      logger.log("get key", key)
      const val = await ReaderDB.UserLocalSettings.get(key)
      if (val === null) {
        return Maybe.Just(defaultValue)
      }
      return val.withDefault(defaultValue) as Maybe<T>
    },
    async (get, set, newValue: T | Action<T>) => {
      const profile = await get(profileAtom)
      const userId = profile?.id ?? ""
      if (!userId) {
        return
      }
      const key = `${userId}@${_key}`
      const clonedDef = clone(defaultValue)
      const oldVal = (await get(combined)).withDefault(clonedDef)

      if (typeof newValue === "function") {
        newValue = (newValue as Action<T>)(oldVal.unwrap())
      }

      logger.log("set key", key)
      await ReaderDB.UserLocalSettings.save(key, newValue)
      set(versionAtom, (x) => x + 1)
    }
  )
  return combined
}
