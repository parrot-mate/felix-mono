import {
  AccountState,
  Cached,
  LocalProfileState,
  OfflineCacheItem,
  ReviseRecord,
} from "@pmate/meta"
import { Maybe, isMaybe } from "@pmate/utils"
import { openDB } from "idb"

async function open() {
  const db = await openDB("CacheDB", 4, {
    upgrade(db) {
      const kvStores = ["cache", "images", "tmp", "offline", "revise"]
      for (const storeName of kvStores) {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName)
        }
      }
    },
  })
  return db
}

export class CacheDB<T> {
  constructor(private name: string) {}

  public async save(data: T | Maybe<T>): Promise<void>
  public async save(key: string, data: T | Maybe<T>): Promise<void>
  public async save(key: string | T | Maybe<T>, data?: any): Promise<void> {
    if (typeof key === "string") {
      if (isMaybe(data)) {
        if (data.isNothing()) {
          return
        }
        data = data.unwrap()
      }
      try {
        const db = await open()
        const tx = db.transaction(this.name, "readwrite")
        const store = tx.objectStore(this.name)

        await store.put(data, key)
        await tx.done
      } catch (ex) {
        console.log(`Save to ${this.name} fail.`, ex)
      }
    } else {
      if (isMaybe(key)) {
        if (key.isNothing()) {
          return
        }
        key = key.unwrap()
      }
      try {
        const db = await open()
        const tx = db.transaction(this.name, "readwrite")
        const store = tx.objectStore(this.name)
        await store.add(key)
        await tx.done
      } catch (ex) {
        console.log(`Save to ${this.name} fail.`, ex)
      }
    }
  }

  public async list(): Promise<string[]> {
    const db = await open()
    const tx = db.transaction(this.name, "readonly")
    const store = tx.objectStore(this.name)
    const keys = await store.getAllKeys()
    return keys.map((x) => x.toString())
  }

  public async getAll(): Promise<Maybe<T[]>> {
    const db = await open()
    const tx = db.transaction(this.name, "readonly")
    const store = tx.objectStore(this.name)
    const val = ((await store.getAll()) as T[]) || []
    return Maybe.Just<T[]>(val)
  }

  public async get(key: string): Promise<Maybe<T>> {
    const db = await open()
    const tx = db.transaction(this.name, "readonly")
    const store = tx.objectStore(this.name)
    const val = await store.get(key)
    return val ? Maybe.Just(val) : Maybe.Nothing()
  }

  public async clear(): Promise<void> {
    const db = await open()
    const tx = db.transaction(this.name, "readwrite")
    const store = tx.objectStore(this.name)
    await store.clear()
    await tx.done
  }

  public async delete(key: string): Promise<void> {
    const db = await open()
    const tx = db.transaction(this.name, "readwrite")
    const store = tx.objectStore(this.name)
    await store.delete(key)
    await tx.done
  }

  public static CacheDB = new CacheDB<Cached<any>>("cache")
  public static AIImageDB = new CacheDB<{
    url: string
  }>("images")
  public static UserDB = new CacheDB<LocalProfileState | AccountState>("tmp")
  public static Offline = new CacheDB<OfflineCacheItem>("offline")
  public static ReviseDB = new CacheDB<ReviseRecord>("revise")
}
