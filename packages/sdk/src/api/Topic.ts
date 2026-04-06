import { Api } from "./Api"
import { CacheDB } from "@pmate/sdk"
import { TS_Block, TS_Log, TS_RESPONSE } from "@pmate/meta"
import { lru } from "@pmate/utils"

const TSDB_URL = (
  process.env.VITE_PUBLIC_TSDB_URL ??
  process.env.PUBLIC_TSDB_URL ??
  "https://logs-global.skedo.cn"
).replace(/\/+$/, "")

const STATIC_URL = (
  process.env.VITE_PUBLIC_RESOURCE_URL ?? "https://book.skedo.cn"
).replace(/\/+$/, "")

async function _loadTopic(topic: string): Promise<TS_RESPONSE | null> {
  const url = `${TSDB_URL}/read?topic=${encodeURIComponent(topic)}&from=0`
  try {
    const resp = await fetch(url)
    if (!resp.ok) return null
    const json = (await resp.json()) as { success: boolean; data: TS_RESPONSE }
    if (!json.success) return null
    return json.data
  } catch {
    return null
  }
}

const loadTopic = lru(_loadTopic, { ttl: 1_000, key: (topic) => topic })

export interface TopicCache<TData> {
  lastUpdateTime: number
  logs: TS_Log<TData>[]
}

export class Topic<TData = any> {
  constructor(protected topic: string, private ttl = 1000) {}

  private logs: TS_Log<TData>[] = []
  private lastUpdateTime = 0

  async add(_logs: TS_Log<TData>[]): Promise<void> {
    throw new Error("Add not implemented for this topic")
  }

  private async fetchBlock(id: string): Promise<TS_Block | null> {
    const cacheKey = `@tsdb-block:${this.topic}:${id}`
    const cached = await CacheDB.CacheDB.get(cacheKey)
    if (cached.isJust()) {
      return cached.unwrap().data as TS_Block
    }
    const url = `${STATIC_URL}/tsdb/${this.topic}/blocks/${id}.json`
    const block = await Api.getFile<TS_Block>(url)
    if (block) {
      await CacheDB.CacheDB.save(cacheKey, { expire: 0, data: block })
      return block
    }
    return null
  }

  async load(): Promise<TS_Log<TData>[]> {
    const now = Date.now()

    try {
      const data = await loadTopic(this.topic)
      if (!data) return this.logs

      const blocks = await Promise.all(
        data.blocks.map((id) => this.fetchBlock(id))
      )

      const logs: TS_Log<TData>[] = []
      for (const b of blocks) {
        if (b) {
          logs.push(...b.logs)
        }
      }

      for (const log of data.logs) {
        logs.push(log as TS_Log<TData>)
      }

      logs.sort((a, b) => a.t - b.t)

      this.logs = logs
      this.lastUpdateTime = now

      return this.logs
    } catch {
      return this.logs
    }
  }

  async query(from = 0, end = Date.now()): Promise<TS_Log<TData>[]> {
    const logs = await this.load()
    return logs.filter((l) => l.t >= from && l.t <= end)
  }
}
