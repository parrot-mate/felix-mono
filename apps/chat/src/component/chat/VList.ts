import { Emitter } from "@pmate/utils"

type EntryViewportOptions = {
  offset: number
  viewportTop: number
  viewportBottom: number
  overscanPx: number
  fallbackHeight: number
}

type EntryViewportResult = {
  value: boolean
  changed: boolean
  height: number
}

export type EntryState = {
  isFirstRendered: boolean
  inViewPort: () => boolean
  height?: number
}

export class Entry<T> implements EntryState {
  item: T
  key: string
  index: number
  isFirstRendered: boolean
  height?: number
  private inViewPortState: boolean

  constructor(item: T, key: string, index: number) {
    this.item = item
    this.key = key
    this.index = index
    this.isFirstRendered = false
    this.inViewPortState = true
  }

  updateHeight(height?: number) {
    if (typeof height !== "number" || Number.isNaN(height)) {
      return false
    }
    if (this.height === height && this.isFirstRendered) {
      return false
    }
    this.height = height
    this.isFirstRendered = true
    return true
  }

  inViewPort(): boolean
  inViewPort(options: EntryViewportOptions): EntryViewportResult
  inViewPort(options?: EntryViewportOptions): boolean | EntryViewportResult {
    if (!options) {
      return this.inViewPortState
    }
    const { offset, viewportTop, viewportBottom, overscanPx, fallbackHeight } = options
    const height = this.resolveHeight(fallbackHeight)
    const top = offset
    const bottom = top + height
    const value =
      bottom >= viewportTop - overscanPx && top <= viewportBottom + overscanPx
    const changed = value !== this.inViewPortState
    this.inViewPortState = value
    return { value, changed, height }
  }

  private resolveHeight(fallbackHeight: number) {
    return typeof this.height === "number" && this.height > 0 ? this.height : fallbackHeight
  }
}

export class VList<T> {
  static readonly DEFAULT_HEIGHT_FALLBACK = 120

  private entries: Entry<T>[] = []
  private entryMap = new Map<string, Entry<T>>()
  private overscanPx: number
  private emitter = new Emitter<"change">()

  constructor(overscanPx: number) {
    this.overscanPx = overscanPx
  }

  setOverscanPx(overscanPx: number) {
    this.overscanPx = overscanPx
  }

  onChange(handler: () => void) {
    return this.emitter.on("change", handler)
  }

  getEntries() {
    return this.entries
  }

  renew(data: T[], resolveKey: (item: T, index: number) => string) {
    const nextEntries: Entry<T>[] = []
    const nextMap = new Map<string, Entry<T>>()
    let changed = this.entries.length !== data.length

    for (let i = 0; i < data.length; i += 1) {
      const item = data[i]
      const key = resolveKey(item, i)
      const existing = this.entryMap.get(key)
      if (existing) {
        if (existing.item !== item || existing.index !== i) {
          existing.item = item
          existing.index = i
          changed = true
        }
        nextEntries.push(existing)
        nextMap.set(key, existing)
      } else {
        const entry = new Entry(item, key, i)
        nextEntries.push(entry)
        nextMap.set(key, entry)
        changed = true
      }
    }

    if (!changed) {
      for (let i = 0; i < nextEntries.length; i += 1) {
        if (nextEntries[i] !== this.entries[i]) {
          changed = true
          break
        }
      }
    }

    this.entries = nextEntries
    this.entryMap = nextMap

    if (changed) {
      this.emitChange()
    }
  }

  areAllMeasured() {
    if (!this.entries.length) {
      return false
    }
    return this.entries.every((entry) => typeof entry.height === "number")
  }

  getEntry(key: string) {
    return this.entryMap.get(key)
  }

  notifyChange() {
    this.emitChange()
  }

  computeViewportState(scrollTop: number, clientHeight: number) {
    if (!this.entries.length) {
      return
    }
    const viewportTop = scrollTop
    const viewportBottom = viewportTop + clientHeight
    let offset = 0
    let changed = false
    const fallbackHeight = this.getFallbackHeight()

    for (const entry of this.entries) {
      const { changed: entryChanged, height } = entry.inViewPort({
        offset,
        viewportTop,
        viewportBottom,
        overscanPx: this.overscanPx,
        fallbackHeight,
      })
      if (entryChanged) {
        changed = true
      }
      offset += height
    }

    if (changed) {
      this.emitChange()
    }
  }

  findFirstInViewport() {
    for (let i = 0; i < this.entries.length; i += 1) {
      if (this.entries[i].inViewPort()) {
        return i
      }
    }
    return -1
  }

  private getFallbackHeight() {
    const measuredHeights = this.entries
      .map((entry) => entry.height)
      .filter((value): value is number => typeof value === "number" && value > 0)
    if (!measuredHeights.length) {
      return VList.DEFAULT_HEIGHT_FALLBACK
    }
    const total = measuredHeights.reduce((sum, value) => sum + value, 0)
    return total / measuredHeights.length
  }

  private emitChange() {
    this.emitter.emit("change")
  }
}
