import { openDB, IDBPDatabase } from "idb"

interface IDBRepoDB<T> {
  items: T[]
}

export class IDBRepo<T> {
  private dbPromise: Promise<IDBPDatabase<IDBRepoDB<T>>>

  constructor(
    private key: string,
    private idMapper: (x: T) => string | number
  ) {
    this.dbPromise = openDB<IDBRepoDB<T>>(this.key, 1, {
      upgrade(db) {
        db.createObjectStore("items", { autoIncrement: true })
      },
    })
  }

  public async getList(): Promise<T[]> {
    const db = await this.dbPromise
    return db.transaction("items").objectStore("items").getAll() || []
  }

  public async save(list: T[]) {
    const db = await this.dbPromise
    const tx = db.transaction("items", "readwrite")
    await tx.objectStore("items").clear() // Clear existing items
    for (const item of list) {
      await tx.objectStore("items").add(item)
    }
    await tx.done
  }

  public async addOrUpdate(item: T) {
    const list = await this.getList()
    const existingItemIndex = list.findIndex(
      (x) => this.idMapper(x) === this.idMapper(item)
    )
    if (existingItemIndex === -1) {
      list.push(item)
    } else {
      list[existingItemIndex] = item
    }
    await this.save(list)
  }

  public async update(key: number | string, updator: (item: T) => T) {
    let list = await this.getList()
    const index = list.findIndex((x) => this.idMapper(x) === key)

    if (index === -1) {
      throw new Error("Item not found")
    }

    list[index] = updator(list[index])
    await this.save(list)
  }

  public async findOne(key: number | string): Promise<T | undefined> {
    const list = await this.getList()
    return list.find((x) => this.idMapper(x) === key)
  }

  public async remove(key: number | string) {
    let list = await this.getList()
    const index = list.findIndex((x) => this.idMapper(x) === key)

    if (index === -1) {
      throw new Error("Item not found")
    }

    list.splice(index, 1)
    await this.save(list)
  }

  public async clear() {
    const db = await this.dbPromise
    const tx = db.transaction("items", "readwrite")
    await tx.objectStore("items").clear()
    await tx.done
  }

  // Static store examples would remain the same conceptually,
  // but remember to pass in the correct database name and version
  // as needed for your specific IndexedDB setup.
}
