const API_BASE = (
  import.meta.env.VITE_PUBLIC_INDEXER_API_BASE ?? "http://localhost:3001"
).replace(/\/+$/, "")

const DEFAULT_CHAIN_ID = import.meta.env.VITE_DEFAULT_CHAIN_ID ?? "pmate"

export const defaultChainId = String(DEFAULT_CHAIN_ID)

interface ApiResponse<T> {
  data: T
  message?: unknown
  success: boolean
}

export type IndexerRequestParams = Record<
  string,
  string | number | boolean | undefined
>

export type IndexerParamType = "string" | "number" | "boolean" | "select"

export interface IndexerParamManifest {
  id: string
  type: IndexerParamType
  required?: boolean
  placeholder?: string
  helperText?: string
  defaultValue?: string | number | boolean
  options?: Array<{ value: string; label: string }>
}

export interface IndexerActionManifest {
  id: string
  params: IndexerParamManifest[]
}

export interface IndexerManifest {
  id: string
  actions: IndexerActionManifest[]
}

export interface ChainIndexerConfig {
  id: string
  indexers: IndexerManifest[]
}

export async function requestIndexer<T>(
  chainId: string,
  indexerName: string,
  action: string,
  params?: IndexerRequestParams
): Promise<T> {
  const url = new URL(
    `${API_BASE}/${encodeURIComponent(chainId)}/${encodeURIComponent(
      indexerName
    )}/${encodeURIComponent(action)}`
  )

  if (params) {
    for (const [key, rawValue] of Object.entries(params)) {
      if (typeof rawValue === "undefined") {
        continue
      }
      if (typeof rawValue === "boolean") {
        if (rawValue) {
          url.searchParams.set(key, "true")
        }
        continue
      }
      url.searchParams.set(key, String(rawValue))
    }
  }

  const res = await fetch(url.toString())
  if (!res.ok) {
    throw new Error(`request failed with status ${res.status}`)
  }

  let payload: unknown
  try {
    payload = await res.json()
  } catch {
    throw new Error("invalid JSON response from indexer")
  }

  if (!isApiResponse(payload)) {
    throw new Error("invalid API response envelope")
  }

  if (!payload.success) {
    const message =
      typeof payload.message === "string" && payload.message.length > 0
        ? payload.message
        : "indexer request failed"
    throw new Error(message)
  }

  return payload.data as T
}

export async function fetchIndexerConfigs(): Promise<ChainIndexerConfig[]> {
  const url = `${API_BASE}/config/indexers`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`config request failed with status ${res.status}`)
  }

  let payload: unknown
  try {
    payload = await res.json()
  } catch {
    throw new Error("invalid JSON response from indexer config endpoint")
  }

  if (!isApiResponse(payload)) {
    throw new Error("invalid config API response envelope")
  }

  if (!payload.success) {
    const message =
      typeof payload.message === "string" && payload.message.length > 0
        ? payload.message
        : "indexer config request failed"
    throw new Error(message)
  }

  return payload.data as ChainIndexerConfig[]
}

function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  if (!value || typeof value !== "object") {
    return false
  }
  const record = value as Record<string, unknown>
  return typeof record.success === "boolean" && "data" in record
}
