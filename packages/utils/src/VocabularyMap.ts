import { Emitter } from "./Emitter"

export class VocabularyMap<T> extends Emitter<string> {
  private map = new Map<string, T>()

  insert(word: string, data: T): void {
    if (!word) return
    const key = word.toLowerCase()
    this.map.set(key, data)
    this.emit("change", key)
  }

  search(word: string): T | null {
    if (!word) return null
    const key = word.toLowerCase()
    return this.map.get(key) || null
  }

  remove(word: string): boolean {
    if (!word) return false
    const key = word.toLowerCase()
    const existed = this.map.delete(key)
    if (existed) {
      this.emit("change", key)
    }
    return existed
  }

  size(): number {
    return this.map.size
  }
}
