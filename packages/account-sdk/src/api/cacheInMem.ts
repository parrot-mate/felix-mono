import { calculateSHA1Hash, Maybe } from "@pmate/utils"

export const cacheInMem = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  prefix: string,
  timeout: number
): T => {
  const cache = new Map<string, { value: any; expiry: number }>()
  const ongoingRequests = new Map<string, Promise<any>>()

  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const hashRaw = args
      .map((x) => {
        if (x instanceof Maybe) {
          return x.map((item) => JSON.stringify(item)).unwrapOr("")
        }
        return JSON.stringify(x)
      })
      .join("--")

    const hash = await calculateSHA1Hash(hashRaw)
    const cacheKey = `${prefix}:${hash}`

    const cached = cache.get(cacheKey)
    if (cached && cached.expiry > Date.now()) {
      return cached.value
    }

    const ongoingRequest = ongoingRequests.get(cacheKey)
    if (ongoingRequest) {
      return ongoingRequest
    }

    const requestPromise = (async () => {
      try {
        const result = await fn(...args)

        if (result) {
          cache.set(cacheKey, { value: result, expiry: Date.now() + timeout })
        }
        return result
      } finally {
        setTimeout(() => ongoingRequests.delete(cacheKey), 50)
      }
    })()

    ongoingRequests.set(cacheKey, requestPromise)

    return requestPromise
  }) as T
}
