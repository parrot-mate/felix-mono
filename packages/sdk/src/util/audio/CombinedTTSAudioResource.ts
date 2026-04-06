import { Emitter } from "@pmate/utils"
import type { TTSAudioResource } from "./TTSAudioResource"

export type TTSAudioEntry = {
  key: string
  item: TTSAudioResource
}

export type CombinedAudioState = "playing" | "paused" | "stopped"

export enum CombinedTTSAudioResourceEvents {
  StateChange,
}

type CombinedStateEvent = {
  playKey?: string
  state: CombinedAudioState
}

export class CombinedTTSAudioResource extends Emitter<CombinedTTSAudioResourceEvents> {
  private readonly keyIndex = new Map<string, number>()
  private currentEntry?: TTSAudioEntry
  private sessionId = 0
  private currentState: CombinedAudioState = "stopped"
  private currentPlayKey?: string

  constructor(private readonly entries: TTSAudioEntry[]) {
    super()
    entries.forEach((entry, index) => {
      this.keyIndex.set(entry.key, index)
    })
  }

  public async play(startKey?: string) {
    this.sessionId++
    const activeSession = this.sessionId
    this.stopCurrentPlayback()

    if (!this.entries.length) {
      this.setState("stopped")
      return
    }

    const startIndex =
      typeof startKey === "undefined" ? 0 : this.keyIndex.get(startKey)

    if (typeof startIndex === "undefined") {
      throw new Error(`TTSAudioEntry not found for key: ${startKey}`)
    }

    const groupFilter =
      typeof startKey === "undefined"
        ? undefined
        : this.entries[startIndex]?.item.getGroup()

    for (let index = startIndex; index < this.entries.length; index++) {
      if (activeSession !== this.sessionId) {
        return
      }
      const entry = this.entries[index]
      if (
        typeof groupFilter !== "undefined" &&
        entry.item.getGroup() !== groupFilter
      ) {
        continue
      }
      this.currentEntry = entry
      this.setState("playing", entry.key)
      this.preloadFollowing(index, groupFilter)
      await entry.item.play()
      if (activeSession !== this.sessionId) {
        return
      }
    }

    if (activeSession === this.sessionId) {
      this.currentEntry = undefined
      this.setState("stopped")
    }
  }

  public pause() {
    if (!this.currentEntry) {
      return
    }
    this.currentEntry.item.pause()
    this.setState("paused", this.currentEntry.key)
  }

  public resume() {
    if (!this.currentEntry) {
      return
    }
    this.currentEntry.item.resume()
    this.setState("playing", this.currentEntry.key)
  }

  public stop() {
    this.sessionId++
    this.stopCurrentPlayback()
    this.setState("stopped")
  }

  private stopCurrentPlayback() {
    if (!this.currentEntry) {
      return
    }
    this.currentEntry.item.stop()
    this.currentEntry = undefined
  }

  private preloadFollowing(currentIndex: number, groupFilter?: string) {
    const preloadTasks: Promise<unknown>[] = []
    for (let offset = 1; offset <= 5; offset++) {
      const entry = this.entries[currentIndex + offset]
      if (!entry) {
        break
      }
      if (
        typeof groupFilter !== "undefined" &&
        entry.item.getGroup() !== groupFilter
      ) {
        continue
      }
      preloadTasks.push(entry.item.load())
    }
    if (preloadTasks.length) {
      void Promise.all(preloadTasks)
    }
  }

  private setState(state: CombinedAudioState, playKey?: string) {
    if (this.currentState === state && this.currentPlayKey === playKey) {
      return
    }
    this.currentState = state
    this.currentPlayKey = playKey
    this.emit<CombinedStateEvent>(CombinedTTSAudioResourceEvents.StateChange, {
      playKey,
      state,
    })
  }
}
