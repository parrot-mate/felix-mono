import { atom, Getter, Setter, WritableAtom } from "jotai"

type AsyncGetter<T> = (get: Getter) => Promise<T>
type AsyncSetter<T> = (get: Getter, set: Setter, action: T) => Promise<void>

export function createAsyncAtom<T>(
  getter: AsyncGetter<T>,
  setter: AsyncSetter<T>,
  options?: { defaultValue?: T }
) {
  const defaultValue = options?.defaultValue || null
  const baseAtom = atom<T | null>(defaultValue)

  const loadableAtom = atom(async (get) => {
    const cachedValue = get(baseAtom)
    if (cachedValue !== null) {
      return cachedValue
    }
    const value = await getter(get)
    return value
  })

  const combinedAtom = atom(
    (get) => get(loadableAtom),
    async (get, set, action: T | ((prev: T) => T)) => {
      const prev = await get(loadableAtom)
      const newValue =
        typeof action === "function" ? (action as (prev: T) => T)(prev) : action
      await setter(get, set, newValue)
      set(baseAtom, newValue)
    }
  )

  return combinedAtom as any as WritableAtom<
    Promise<T>,
    [T | ((prev: T) => T)],
    Promise<void>
  >
}
