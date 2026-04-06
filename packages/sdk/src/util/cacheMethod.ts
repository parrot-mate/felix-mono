import { CacheDB } from "@pmate/sdk"
import { Cached } from "@pmate/meta"
import { HashType, isMaybe, Maybe, uniqHash } from "@pmate/utils"

// Caching decorator for methods
interface CacheOptions {
  key?: string
  type: "indexDB" | "memory"
  expireIn: number
}

export function cacheMethod(options: CacheOptions) {
  // Keep a map of in-flight requests keyed by their hash.
  // When a second (or more) parallel call comes in for the same hash,
  // they will re-use the promise that is in flight.
  const inFlightRequests = new Map<string, Promise<Maybe<any>>>()

  return (_: any, __: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value

    const memoryMap = new Map<string, Cached<any>>()

    async function getByKey(key: string) {
      switch (options.type) {
        case "indexDB":
          return await CacheDB.CacheDB.get(key)
        case "memory":
          return memoryMap.has(key)
            ? Maybe.Just(memoryMap.get(key)!)
            : Maybe.Nothing()
        default:
          throw new Error("Invalid cache type")
      }
    }

    async function save(key: string, data: Cached<any>) {
      switch (options.type) {
        case "indexDB":
          return await CacheDB.CacheDB.save(key, data)
        case "memory":
          memoryMap.set(key, data)
          return
        default:
          throw new Error("Invalid cache type")
      }
    }

    descriptor.value = async function (...args: any[]) {
      const key = uniqHash(args, HashType.cacheMethod)

      // First check the cache
      const cachedResult = await getByKey(key)
      if (cachedResult.isJust()) {
        const uCache = cachedResult.unwrap()
        if (uCache.expire > Date.now()) {
          // Cache not expired
          return Maybe.Just(uCache.data)
        }
      }

      // If there is an in-flight request for the same key, reuse it
      if (inFlightRequests.has(key)) {
        return inFlightRequests.get(key)!
      }

      // Otherwise, create a new promise to handle the actual computation
      const promise = (async () => {
        try {
          // Call the original method
          const result: Maybe<any> = await originalMethod.apply(this, args)
          if (!isMaybe(result)) {
            return result
          }
          if (result.isNothing()) {
            // If no data, no need to cache
            return result
          }

          // Cache the successful result
          await save(key, {
            expire: options.expireIn + Date.now(),
            data: result.unwrap(),
          })
          return result
        } finally {
          // Cleanup: remove from in-flight map once done
          inFlightRequests.delete(key)
        }
      })()

      // Store the in-flight promise
      inFlightRequests.set(key, promise)

      return promise
    }

    return descriptor
  }
}
