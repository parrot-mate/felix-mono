import Dexie, { type Table } from "dexie"

const DEFAULT_DB_NAME = "pmate-cache-db"
const DEFAULT_STORE_NAME = "v001"
const DB_VERSION = 1

export interface KVCacheDBOptions {
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

interface KVCacheEntry<T> {
  hash: string
  value: T
}

export class KVCacheDB<T> {
  private static instances: Map<string, KVCacheDB<any>> = new Map()

  static getDB<T>(options: KVCacheDBOptions = {}): KVCacheDB<T> {
    const dbName = options.dbName ?? DEFAULT_DB_NAME
    const storeName = options.storeName ?? DEFAULT_STORE_NAME
    const key = `${dbName}::${storeName}`

    if (!KVCacheDB.instances.has(key)) {
      KVCacheDB.instances.set(
        key,
        new KVCacheDB<T>({
          dbName,
          storeName,
        })
      )
    }

    return KVCacheDB.instances.get(key) as KVCacheDB<T>
  }

  private readonly dbName: string
  private readonly storeName: string
  private readonly db?: Dexie
  private readonly table?: Table<KVCacheEntry<T>, string>
  private readonly memoryStore?: Map<string, T>

  constructor(options: KVCacheDBOptions = {}) {
    this.dbName = options.dbName ?? DEFAULT_DB_NAME
    this.storeName = options.storeName ?? DEFAULT_STORE_NAME

    if (typeof indexedDB === "undefined") {
      this.memoryStore = new Map<string, T>()
      return
    }

    this.db = new Dexie(this.dbName)
    this.db
      .version(DB_VERSION)
      .stores({
        [this.storeName]: "&hash",
      })
    this.table = this.db.table<KVCacheEntry<T>, string>(this.storeName)
  }

  async get(hash: string): Promise<T | undefined> {
    if (this.table) {
      const entry = await this.table.get(hash)
      return entry?.value
    }

    return this.memoryStore?.get(hash)
  }

  async set(hash: string, value: T): Promise<void> {
    if (this.table) {
      await this.table.put({ hash, value })
      return
    }

    this.memoryStore?.set(hash, value)
  }
}
