import { atom, WritableAtom } from "jotai"

export function createLocalStorageAtom<T>(
  key: string,
  options?: { defaultValue?: T }
) {
  const lsValue = JSON.parse(localStorage.getItem(key) || "null")
  const initialValue =
    lsValue !== null ? lsValue : options?.defaultValue || null

  const baseAtom = atom<T | null>(initialValue as T | null)

  const combinedAtom = atom(
    (get) => get(baseAtom),
    (get, set, action: T | null | ((prev: T | null) => T | null)) => {
      const prev = get(baseAtom)
      const newValue =
        typeof action === "function"
          ? (action as (prev: T | null) => T | null)(prev)
          : action

      set(baseAtom, newValue)
    }
  )

  return combinedAtom as any as WritableAtom<
    Promise<T>,
    [T | ((prev: T) => T)],
    void
  >
}
