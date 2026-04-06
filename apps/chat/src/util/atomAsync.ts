import { atom, Getter, PrimitiveAtom, Setter, WritableAtom } from "jotai"

type ReadFunction<T> = (get: Getter) => Promise<T>
type WriteFunction<TParams extends unknown[]> = (
  get: Getter,
  set: Setter,
  ...params: TParams
) => Promise<void>

export function atomAsync<T, TParams extends unknown[]>(
  read: ReadFunction<T> | null,
  write?: WriteFunction<TParams>
) {
  read = promiseWrapper(read)
  if (write) {
    return atom(read, write) as WritableAtom<Promise<T>, TParams, unknown>
  }
  return atom(read) as WritableAtom<Promise<T>, TParams, unknown>
}

function promiseWrapper(fn: any) {
  return async (...args: Parameters<typeof fn>) => {
    try {
      const result = await fn(...args)
      return result
    } catch (ex) {
      console.error(ex)
      throw ex
    }
  }
}
