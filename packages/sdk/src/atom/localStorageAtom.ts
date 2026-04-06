import { atom } from "jotai"
import { atomFamily } from "jotai/utils"

export enum LSKEYS {
  MY_BOOKS = "my-books",
  USER = "$$user$$",
  USER_SETTINGS = "user-settings",
  APPVER = "version",
}

const cacheAtom = atomFamily((_: LSKEYS) => atom<any>(undefined))
export const localStorageJsonAtom = atomFamily((key: LSKEYS) =>
  atom(
    (get) => {
      const cache = get(cacheAtom(key))
      if (cache) {
        return cache
      }
      try {
        const item = localStorage.getItem(key)
        if (!item) {
          return null
        }
        return JSON.parse(item)
      } catch (ex) {
        return null
      }
    },
    (_, set, value: any) => {
      localStorage.setItem(key, JSON.stringify(value))
      set(cacheAtom(key), value)
    }
  )
)
