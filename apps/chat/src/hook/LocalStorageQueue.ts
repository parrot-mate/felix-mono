export class LocalStorageQueue<T> {
  private key: string
  private limit: number

  constructor(key: string, limit: number) {
    this.key = key
    this.limit = limit
  }

  add(item: T): void {
    let items = this.getItems()
    items.push(item)
    // If the items exceed the limit, remove the oldest one.
    if (items.length > this.limit) {
      items.shift() // Removes the first item of the array
    }
    localStorage.setItem(this.key, JSON.stringify(items))
  }

  getItems(): T[] {
    const items = localStorage.getItem(this.key)
    return items ? JSON.parse(items) : []
  }

  clear(): void {
    localStorage.removeItem(this.key)
  }
}
