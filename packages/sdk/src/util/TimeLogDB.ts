import { TimeLog } from "@pmate/meta"
import Dexie, { type Table } from "dexie"

const DEFAULT_DB_NAME = "time-log-db"
const DEFAULT_STORE_NAME = "timeLogs"
const DB_VERSION = 1

export interface TimeLogDBOptions {
  /**
   * Custom database name.
   * Defaults to {@link DEFAULT_DB_NAME}.
   */
  dbName?: string
  /**
   * Custom store name inside the database.
   * Defaults to {@link DEFAULT_STORE_NAME}.
   */
  storeName?: string
}

export class TimeLogDB {
  private readonly dbName: string
  private readonly storeName: string
  private readonly db: Dexie
  private readonly logsTable: Table<TimeLog, string>

  constructor(options: TimeLogDBOptions = {}) {
    if (typeof indexedDB === "undefined") {
      throw new Error("IndexedDB is not available in this environment")
    }

    this.dbName = options.dbName ?? DEFAULT_DB_NAME
    this.storeName = options.storeName ?? DEFAULT_STORE_NAME

    const schema: Record<string, string> = {
      [this.storeName]: "&hash,t",
    }

    this.db = new Dexie(this.dbName)
    this.db.version(DB_VERSION).stores(schema)
    this.logsTable = this.db.table<TimeLog, string>(this.storeName)
  }

  async get(hash: string): Promise<TimeLog | undefined> {
    return this.logsTable.get(hash)
  }

  async put<T extends TimeLog>(log: T): Promise<void> {
    await this.logsTable.put(log as TimeLog)
  }

  async putMany<T extends TimeLog>(logs: readonly T[]): Promise<T[]> {
    if (!logs.length) return []
    const hashes = logs.map((log) => log.hash)
    const existing = await this.logsTable.bulkGet(hashes)
    const seen = new Set<string>()
    const missing = logs.filter((log, index) => {
      if (existing[index]) return false
      if (seen.has(log.hash)) return false
      seen.add(log.hash)
      return true
    })

    if (!missing.length) return []
    await this.logsTable.bulkAdd(missing as TimeLog[])
    return missing
  }

  async query(page: number, pageSize: number): Promise<TimeLog[]> {
    const normalizedPageSize = this.normalizePositiveInteger(pageSize)

    if (normalizedPageSize === 0) {
      return []
    }

    const normalizedPage = this.normalizePositiveInteger(page)
    const offset = normalizedPage * normalizedPageSize

    const logs = await this.logsTable
      .orderBy("t")
      .reverse()
      .offset(offset)
      .limit(normalizedPageSize)
      .toArray()

    return logs.reverse()
  }

  async lastUpdate(): Promise<number | undefined> {
    const latest = await this.logsTable.orderBy("t").last()
    return latest?.t
  }

  private normalizePositiveInteger(value: number): number {
    if (!Number.isFinite(value) || value <= 0) {
      return 0
    }

    return Math.floor(value)
  }
}
