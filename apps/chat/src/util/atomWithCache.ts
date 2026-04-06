import { atom, Getter } from "jotai"

function atomWithCache<Value>(fetcher: (get: Getter) => Promise<Value>) {
  const cacheAtom = atom<Value | undefined>(undefined)

  const derivedAtom = atom(
    async (get) => {
      const value = get(cacheAtom)
      if (value === undefined) {
        return await fetcher(get)
      }
      return value
    },
    (_get, set, newValue: Value) => {
      set(cacheAtom, newValue)
    }
  )
  return derivedAtom
}

export default atomWithCache
