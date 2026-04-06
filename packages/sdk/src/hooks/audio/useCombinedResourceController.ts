import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AudioTaskInit } from "@pmate/meta"

import {
  CombinedAudioState,
  CombinedTTSAudioResource,
  CombinedTTSAudioResourceEvents,
  TTSAudioResource,
} from "@sdk/util/audio"

export type CombinedResourceInput = {
  key: string
  init: AudioTaskInit
}

type ResourceRecord = {
  instance: TTSAudioResource
  signature: string
}

const serializeInit = (init: AudioTaskInit) => JSON.stringify(init)

export const useCombinedResourceController = (
  entries: CombinedResourceInput[]
) => {
  const resourceMapRef = useRef<Map<string, ResourceRecord>>(new Map())

  const ttsEntries = useMemo(() => {
    const map = resourceMapRef.current
    const activeKeys = new Set<string>()
    const normalized = entries.map(({ key, init }) => {
      const signature = serializeInit(init)
      const existing = map.get(key)
      if (!existing || existing.signature !== signature) {
        map.set(key, {
          instance: new TTSAudioResource(init),
          signature,
        })
      }
      activeKeys.add(key)
      return {
        key,
        item: map.get(key)!.instance,
      }
    })

    map.forEach((_value, key) => {
      if (!activeKeys.has(key)) {
        map.delete(key)
      }
    })

    return normalized
  }, [entries])

  const combinedResource = useMemo(
    () => new CombinedTTSAudioResource(ttsEntries),
    [ttsEntries]
  )

  const [state, setState] = useState<CombinedAudioState>("stopped")
  const [playKey, setPlayKey] = useState<string | undefined>(undefined)

  useEffect(() => {
    const dispose = combinedResource.on(
      CombinedTTSAudioResourceEvents.StateChange,
      ({ state, playKey }: { state: CombinedAudioState; playKey?: string }) => {
        setState(state)
        setPlayKey(playKey)
      }
    )

    return () => {
      dispose()
      combinedResource.stop()
    }
  }, [combinedResource])

  const play = useCallback(
    async (key?: string) => {
      await combinedResource.play(key)
    },
    [combinedResource]
  )

  const pause = useCallback(() => {
    combinedResource.pause()
  }, [combinedResource])

  const resume = useCallback(() => {
    combinedResource.resume()
  }, [combinedResource])

  const stop = useCallback(() => {
    combinedResource.stop()
  }, [combinedResource])

  return {
    play,
    pause,
    resume,
    stop,
    state,
    playKey,
  }
}
