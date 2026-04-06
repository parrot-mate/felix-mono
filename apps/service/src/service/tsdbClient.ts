import type { TS_Block, TS_Log } from "@pmate/meta"
import fetch, { RequestInit as NodeFetchRequestInit } from "node-fetch"
import { POSS } from "../util/alioss"

const TSDB_URL = (
  process.env.TSDB_URL ??
  process.env.PUBLIC_TSDB_URL ??
  "https://logs-global.skedo.cn"
).replace(/\/+$/, "")

type RemoteTSLog<T> = Partial<TS_Log<T>> & {
  time?: number
}

type RemoteTSResponse<T> = {
  topic: string
  blocks: string[]
  logs: RemoteTSLog<T>[]
}

const defaultBaseUrl = TSDB_URL.replace(/\/+$/, "")
const baseUrl = process.env.TSDB_ENDPOINT?.replace(/\/+$/, "") ?? defaultBaseUrl
const bearerToken = process.env.TSDB_BEARER_TOKEN ?? ""

const AUTHORIZATION_HEADER = bearerToken ? `Bearer ${bearerToken}` : ""

const serializeLog = <T>(log: TS_Log<T>): RemoteTSLog<T> => {
  const time =
    typeof log.t === "number"
      ? log.t
      : typeof (log as RemoteTSLog<T>).time === "number"
      ? (log as RemoteTSLog<T>).time
      : Date.now()

  return {
    data: log.data,
    kind: log.kind,
    topic: log.topic,
    hash: log.hash,
    time,
    size: log.size,
  }
}

const normalizeRemoteLog = <T>(log: RemoteTSLog<T>): TS_Log<T> => {
  const t =
    typeof log.t === "number"
      ? log.t
      : typeof log.time === "number"
      ? log.time
      : Date.now()

  return {
    data: log.data as T,
    kind: log.kind ?? 0,
    topic: log.topic ?? "",
    hash: log.hash ?? "",
    size: log.size ?? JSON.stringify(log.data ?? "").length,
    t,
  }
}

const fetchJSON = async <T>(
  path: string,
  init: NodeFetchRequestInit
): Promise<T | null> => {
  const url = `${baseUrl}${path}`
  const resp = await fetch(url, init)
  if (!resp.ok) {
    const text = await resp.text().catch(() => "")
    throw new Error(
      `TSDB request failed (${resp.status} ${resp.statusText}): ${text}`
    )
  }
  if (resp.status === 204) {
    return null
  }
  return (await resp.json()) as T
}

const ensureAuth = () => {
  if (!AUTHORIZATION_HEADER) {
    throw new Error("TSDB_BEARER_TOKEN environment variable is not set")
  }
}

const buildQuery = (
  params: Record<string, string | number | undefined>
): string => {
  const usp = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      usp.set(key, String(value))
    }
  })
  const query = usp.toString()
  return query ? `?${query}` : ""
}

const groupByTopic = <T>(logs: TS_Log<T>[]): Map<string, TS_Log<T>[]> => {
  const grouped = new Map<string, TS_Log<T>[]>()
  for (const log of logs) {
    if (!log.topic) {
      throw new Error("TSDB log missing topic")
    }
    const existing = grouped.get(log.topic) ?? []
    existing.push(log)
    grouped.set(log.topic, existing)
  }
  return grouped
}

export const tsdbClient = {
  async append<T>(logs: TS_Log<T>[]): Promise<void> {
    if (!logs.length) return
    ensureAuth()
    const grouped = groupByTopic(logs)
    for (const [topic, topicLogs] of grouped.entries()) {
      const payload = {
        topic,
        logs: topicLogs.map(serializeLog),
      }
      await fetchJSON<{ success: boolean }>("/append", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: AUTHORIZATION_HEADER,
        },
        body: JSON.stringify(payload),
      })
    }
  },

  async batchAppend<T>(logs: TS_Log<unknown>[]): Promise<void> {
    if (!logs.length) return
    ensureAuth()
    const grouped = groupByTopic(logs)
    const items = Array.from(grouped.entries()).map(([topic, topicLogs]) => ({
      topic,
      logs: topicLogs.map(serializeLog),
    }))
    await fetchJSON<{ success: boolean }>("/batch-append", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: AUTHORIZATION_HEADER,
      },
      body: JSON.stringify({ items }),
    })
  },

  async query<T>(topic: string, from = 0): Promise<RemoteTSResponse<T>> {
    const path = `/read${buildQuery({ topic, from })}`
    const json = await fetchJSON<{
      success: boolean
      data: RemoteTSResponse<T>
    }>(path, {
      method: "GET",
    })
    if (!json?.success) {
      throw new Error(`Failed to query TSDB topic '${topic}'`)
    }
    return json.data
  },

  async deleteTopic(topic: string): Promise<void> {
    ensureAuth()
    const path = `/delete${buildQuery({ topic })}`
    await fetchJSON<{ success: boolean }>(path, {
      method: "GET",
      headers: {
        Authorization: AUTHORIZATION_HEADER,
      },
    })
  },

  async getAllLogs<T>(topic: string): Promise<TS_Log<T>[]> {
    const response = await this.query<T>(topic, 0)
    const inMemoryLogs = response.logs.map(normalizeRemoteLog)
    const persistedLogs: TS_Log<T>[] = []
    for (const blockId of response.blocks) {
      const block = await POSS.publicOSS.getResourceOSS<TS_Block>(
        `tsdb/${topic}/blocks/${blockId}.json`
      )
      if (!block) continue
      for (const log of block.logs) {
        persistedLogs.push(normalizeRemoteLog(log as RemoteTSLog<T>))
      }
    }
    const allLogs = [...inMemoryLogs, ...persistedLogs]
    return allLogs.sort((a, b) => a.t - b.t)
  },
}

export async function fetchTopicLogs<T>(topic: string): Promise<TS_Log<T>[]> {
  return tsdbClient.getAllLogs<T>(topic)
}
