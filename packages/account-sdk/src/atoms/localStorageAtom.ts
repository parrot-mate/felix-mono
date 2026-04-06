import { atom } from "jotai"
import { atomFamily, type AtomFamily } from "jotai-family"
import type { WritableAtom } from "jotai"

export enum LSKEYS {
  USER_SETTINGS = "user-settings",
}

const cacheAtom = atomFamily((_: LSKEYS) => atom<any>(undefined))

type LocalStorageJsonAtomFamily = AtomFamily<
  LSKEYS,
  WritableAtom<any, [any], void>
>

export const localStorageJsonAtom: LocalStorageJsonAtomFamily = atomFamily(
  (key: LSKEYS) =>
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
        } catch {
          return null
        }
      },
      (_, set, value: any) => {
        localStorage.setItem(key, JSON.stringify(value))
        set(cacheAtom(key), value)
      }
    )
)
