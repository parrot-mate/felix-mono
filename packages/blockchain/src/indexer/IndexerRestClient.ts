import qs from "qs"
import type { ChainId } from "../metaTypes"

export type IndexerName =
  | "topics"
  | "account"
  | "profile"
  | "messages"
  | "acl"
  | "message_read"
  | "mapping"
  | "map_indexer"
  | "thread"
  | "table_indexer"
export class IndexerRestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly responseBody?: unknown
  ) {
    super(message)
    this.name = "IndexerRestError"
  }
}

export interface IndexerRestClientOptions {
  baseUrl: string
  defaultHeaders?: Record<string, string>
}

export interface IndexerRequestOptions {
  headers?: Record<string, string>
  query?: Record<string, any>
  method?: "GET" | "POST"
}

export interface IndexerRestResponse<T> {
  success: boolean
  data: T
  message?: string
  [key: string]: unknown
}

export class IndexerRestClient {
  private readonly baseUrl: string

  constructor(options: IndexerRestClientOptions) {
    this.baseUrl = options.baseUrl
  }

  public async request<T>(
    chainId: ChainId,
    indexer: IndexerName,
    action: string,
    options: IndexerRequestOptions = {}
  ): Promise<T> {
    const { query, headers, method = "GET" } = options
    const queryForUrl = method === "GET" ? query : undefined
    const url =
      method === "GET"
        ? this.buildUrl(chainId, indexer, action, queryForUrl)
        : this.buildUrl(chainId, indexer, action)
    const requestHeaders: Record<string, string> = {
      Accept: "application/json",
      ...headers,
    }
    const requestInit: RequestInit = {
      method,
      headers: requestHeaders,
    }
    if (method === "POST") {
      if (!requestHeaders["Content-Type"]) {
        requestHeaders["Content-Type"] = "application/json"
      }
      requestInit.body = JSON.stringify(query ?? {})
    }
    console.log("before request", method, url)
    const resp = await fetch(url, requestInit)
    console.log("resp", resp.status)

    if (resp.status >= 400 && resp.status < 600) {
      const json: IndexerRestResponse<T> = await resp.json()
      if (!json.success) {
        console.error("Indexer request failed:", method, url)
        throw new IndexerRestError(
          `Indexer :${indexer} :${action} request failed: ${
            json.message ?? "unknown error"
          }`,
          resp.status,
          json
        )
      }
    }
    const json = await resp.json()
    return json.data
  }

  private buildUrl(
    chainId: ChainId,
    indexer: IndexerName,
    action: string,
    query?: Record<string, any>
  ) {
    const path = `/${chainId}/${indexer}/${action}`
    const url = new URL(path, this.baseUrl)
    if (query) {
      const serialized = qs.stringify(query)
      if (serialized) {
        url.search = serialized
      }
    }
    return url.toString()
  }
}
