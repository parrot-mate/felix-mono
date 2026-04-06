import { CacheDB } from "./cache/CacheDB"
import { OfflineCacheParams, OfflineCacheType } from "@pmate/meta"
import { HashType, lru, uniqHash } from "@pmate/utils"

export const hashOfflineItem = <T extends OfflineCacheType>(
  type: T,
  params: OfflineCacheParams[T],
  version?: number
) => {
  const json: {
    type: T
    params: OfflineCacheParams[T]
    version?: number
  } = {
    type,
    params,
  }
  if (version) {
    json.version = version
  }
  const hash = uniqHash(json, HashType.Offline)
  return hash
}

export const isResourceExists = async <T extends OfflineCacheType>(
  type: T,
  params: OfflineCacheParams[T]
) => {
  const hash = hashOfflineItem(type, params)
  const cached = await CacheDB.Offline.get(hash)
  if (cached.isJust()) {
    return true
  }
  return false
}

async function getCacheItem<T extends OfflineCacheType>(
  type: T,
  params: OfflineCacheParams[T],
  version?: number
) {
  const hash = hashOfflineItem(type, params, version)
  const item = await CacheDB.Offline.get(hash)
  return item.unwrapOr(null)
}

async function setCacheItem<T extends OfflineCacheType>(
  type: T,
  params: OfflineCacheParams[T],
  data: any,
  version?: number
) {
  const hash = hashOfflineItem(type, params, version)
  await CacheDB.Offline.save(hash, {
    hash,
    data,
  })
}

function isValid(val: any) {
  if (typeof val === "undefined" || val === "" || val === null) {
    return false
  }
  if (Array.isArray(val)) {
    return val.length > 0
  }
  if (typeof val === "object") {
    return Object.keys(val).length > 0
  }
  return true
}

type ResourceFN<T extends OfflineCacheType, TResult> = (
  params: OfflineCacheParams[T]
) => Promise<TResult | null>

export const withOffline = <T extends OfflineCacheType, TResult>(
  type: T,
  fn: ResourceFN<T, TResult>,
  options?: {
    version?: number
  }
) => {
  const cachedFn = lru(fn, {
    ttl: 10_000,
    key: (params) => JSON.stringify(params),
  })
  return async (params: OfflineCacheParams[T]) => {
    const cached = await getCacheItem<T>(type, params, options?.version)
    if (cached?.data) {
      return cached.data as TResult
    }
    try {
      const result = await cachedFn(params)
      if (result && isValid(result)) {
        await setCacheItem<T>(type, params, result, options?.version)
      }
      return result
    } catch (ex) {
      console.error(ex)
      return null
    }
  }
}
