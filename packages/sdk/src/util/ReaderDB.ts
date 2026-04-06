import { openDB } from "idb"
import {
  Book,
  Cached,
  LibraryItem,
  Log,
  UserLocalSettingsValue,
} from "@pmate/meta"
import { Maybe, isMaybe } from "@pmate/utils"

const BOOK_DB = "books@v2"
const BOOKSDATA_DB = "booksdata@v2"
const SETTINGS_DB = "settings@v2"
const CACHE_DB = "cache@v2"
const TMP_CHUNKS_DB = "tmp-chunks@v2"

async function open() {
  const db = await openDB("BookDatabase", 23, {
    upgrade(db, oldVersion, newVersion) {
      console.log("idx, here, upgrade from", oldVersion, "to", newVersion)

      const kvStores = [BOOK_DB, BOOKSDATA_DB, SETTINGS_DB, CACHE_DB]
      for (const storeName of kvStores) {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName)
        }
      }

      // Now create "log-chunks" with auto-increment
      if (!db.objectStoreNames.contains(TMP_CHUNKS_DB)) {
        db.createObjectStore(TMP_CHUNKS_DB, {
          keyPath: "hash",
        })
      }
    },
  })
  return db
}

export class ReaderDB<T> {
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

  public static BooksDB = new ReaderDB<LibraryItem>(BOOK_DB)
  public static DataDb = new ReaderDB<Blob | string | Book>(BOOKSDATA_DB)
  public static UserLocalSettings = new ReaderDB<UserLocalSettingsValue>(
    SETTINGS_DB
  )
  public static CacheDB = new ReaderDB<Cached<any>>(CACHE_DB)
  public static LogChunks = new ReaderDB<Log>(TMP_CHUNKS_DB)
}
