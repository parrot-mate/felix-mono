import { ReaderDB } from "@pmate/sdk"
import { Logger, Maybe } from "@pmate/utils"

const logger = Logger.getDebugger("cacheWithExpiration")

export async function cacheWithExpiration<T>(
  key: string,
  fetchData: () => Promise<Maybe<T>>,
  expirationTime: number = 1000 * 60 * 30, // default 30 minutes
  cacheFilter?: (data: T) => boolean
): Promise<Maybe<T>> {
  const item = await ReaderDB.CacheDB.get(key)
  async function updateCache() {
    const data = await fetchData()

    if (data.isJust()) {
      if (cacheFilter) {
        if (!cacheFilter(data.unwrap())) {
          return data
        }
      }
      await ReaderDB.CacheDB.save(key, {
        expire: Date.now() + expirationTime,
        data: data.unwrap(),
      })
      return data
    }
    return data
  }

  if (item.isJust()) {
    if (item.map((x) => x.expire < Date.now()).unwrap()) {
      updateCache()
    }
    return item.map((x) => x.data)
  }
  const val = await updateCache()
  return val
}
