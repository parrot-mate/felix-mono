import { HashType, uniqHash } from "@pmate/utils"
import { KVCacheDB } from "@sdk/util"
import { Api } from "./Api"

const endpoint = process.env.VITE_PUBLIC_ACCOUNT_SERVICE!

type ChunkQuery = {
  page?: number
} & Record<string, string | number | undefined>

export interface ChunkResultV2<T> {
  page: number
  pageSize: number
  totalPage: number
  data: T[]
}

const chunkCache = KVCacheDB.getDB<ChunkResultV2<unknown>>({
  dbName: "chunk-service@v2",
  storeName: "chunks",
})

export class ChunkServiceV2 {
  private static buildUrl(indexer: string, action: string, query?: ChunkQuery) {
    const base = endpoint.endsWith("/") ? endpoint : `${endpoint}/`
    const url = new URL(`chunk/${indexer}/${action}`, base)
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null) continue
        url.searchParams.set(key, String(value))
      }
    }
    return url.toString()
  }

  private static buildCacheKey(
    indexer: string,
    action: string,
    query: ChunkQuery
  ) {
    return uniqHash(
      {
        indexer,
        action,
        query,
      },
      HashType.JSON
    )
  }

  static async request<T>(
    indexer: string,
    action: string,
    query?: ChunkQuery
  ): Promise<ChunkResultV2<T> | null> {
    const cacheKey =
      query !== undefined ? this.buildCacheKey(indexer, action, query) : null

    if (cacheKey) {
      try {
        const cachedPage = await chunkCache.get(cacheKey)
        if (
          cachedPage &&
          Array.isArray(cachedPage.data) &&
          cachedPage.data.length === cachedPage.pageSize
        ) {
          return cachedPage as ChunkResultV2<T>
        }
      } catch {
        // Ignore cache errors to allow network request fallback.
      }
    }

    const url = this.buildUrl(indexer, action, query)
    const result = (await Api.get<ChunkResultV2<T>>(url)) || null

    if (
      cacheKey &&
      result &&
      Array.isArray(result.data) &&
      result.data.length === result.pageSize
    ) {
      try {
        await chunkCache.set(cacheKey, result as ChunkResultV2<unknown>)
      } catch {
        // Ignore cache write errors so request still resolves.
      }
    }

    return result
  }
}
