import { isLoadable, Loadable } from "@pmate/utils"
import { Atom, atom } from "jotai"
import { unwrap } from "jotai/utils"
import { AsyncFN, UnwrapPromise } from "./atomWithLoadable"

export interface RetriableOption<T> {
  isValid?: (result: UnwrapPromise<ReturnType<AsyncFN<T>>>) => boolean
  placeHolderValue?: T
}

export const atomWithRetry = <T>(
  asyncFn: AsyncFN<T>,
  options: RetriableOption<T> = {
    isValid: undefined,
  }
) => {
  const retrySignalAtom = atom(0)

  const baseAtom = atom(async (get) => {
    get(retrySignalAtom)
    try {
      const result = await asyncFn(get)
      if (isLoadable(result)) {
        return result
      }
      if (typeof result === "undefined" || result === null) {
        return Loadable.Nothing<T>()
      }
      if (options?.isValid && !options.isValid(result)) {
        return Loadable.Nothing<T>()
      }
      return Loadable.Just<T>(result)
    } catch (error: any) {
      return Loadable.Fail<T>(error)
    }
  })

  const valueAtom = unwrap(baseAtom, () => {
    if (Object.prototype.hasOwnProperty.call(options, "placeHolderValue")) {
      return Loadable.Pending<T>(options.placeHolderValue)
    }
    return Loadable.Pending<T>()
  }) as Atom<Loadable<T>>

  return atom(
    (get) => get(valueAtom),
    (_, set) => set(retrySignalAtom, (v) => v + 1)
  )
}
