import { atom, Getter } from "jotai"
import { unwrap } from "jotai/utils"
import { Loadable } from "@pmate/utils"

type EmptyResult = null | undefined | "" | [] | Record<string, never>

const isEmptyResult = (result: unknown): result is EmptyResult => {
  if (result == null || result === "") return true
  if (Array.isArray(result) && result.length === 0) return true
  if (typeof result === "object" && Object.keys(result as object).length === 0)
    return true
  return false
}

interface RetryOptions {
  retryTimes: number
  interval: number
}


export const atomWithRetry = <T>(
  asyncFn: (get: Getter) => Promise<T>,
  options: RetryOptions = {
    retryTimes: 3,
    interval: 500,
  }
) => {
  const ver = atom(0)
  const readAtom = unwrap(
    atom(async (get) => {
      let attempts = 0
      let result: T | undefined
      const { retryTimes, interval } = options
      get(ver)

      while (attempts <= retryTimes) {
        try {
          result = await asyncFn(get)

          if (!isEmptyResult(result)) {
            return Loadable.Just(result)
          }
        } catch (error) {
          if (attempts === retryTimes) {
            return Loadable.Fail<T>(error)
          }
        }

        attempts++
        await new Promise((resolve) => setTimeout(resolve, interval))
      }

      return Loadable.Fail<T>(
        new Error(`Failed after ${retryTimes + 1} attempts.`)
      )
    }),
    () => Loadable.Pending<T>()
  )

  return atom(
    (get) => {
      return get(readAtom)
    },
    (_, set) => {
      set(ver, (v) => v + 1)
    }
  )
}
