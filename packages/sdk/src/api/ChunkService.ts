import { TimeLog } from "@pmate/meta"
import { Api } from "./Api"

const endpoint = process.env.VITE_PUBLIC_ACCOUNT_SERVICE!

type PrimitiveQuery = string | number | boolean | null | undefined

export interface ChunkQuery {
  [key: string]: PrimitiveQuery
}

export interface ChunkLogsResult<TData> {
  data: TData[]
  prev_cursor?: string
}

export class ChunkService {
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

  public static async request<T>(
    indexer: string,
    action: string,
    query?: ChunkQuery
  ): Promise<T | null> {
    const url = this.buildUrl(indexer, action, query)
    try {
      return (await Api.get<T>(url)) || null
    } catch (error) {
      console.warn("ChunkService request failed", {
        indexer,
        action,
        query,
        error,
      })
      return null
    }
  }

  public static async fetchLogs<TData extends TimeLog>(
    indexer: string,
    query: ChunkQuery,
    options: {
      prevCursor?: string
      maxPage?: number
      startTime?: number
    } = {}
  ): Promise<TData[]> {
    const logs: TData[] = []
    const pageLimit = options.maxPage ?? 1
    const { startTime } = options
    let pageCount = 0
    let cursor = options.prevCursor

    while (pageCount < pageLimit) {
      if (cursor) {
        query.cursor = cursor
      }

      const data = await this.request<ChunkLogsResult<TData>>(
        indexer,
        "list",
        query
      )
      pageCount += 1

      if (!data || !data.data.length) {
        break
      }

      const pageLogs = data.data
      if (startTime !== undefined) {
        const timestamps = pageLogs.map((log) => log.t)
        const pageMax = Math.max(...timestamps)
        if (pageMax < startTime) {
          break
        }
      }

      logs.push(...pageLogs)
      if (!data.prev_cursor) {
        break
      }
      cursor = data.prev_cursor
    }

    return logs
  }
}
