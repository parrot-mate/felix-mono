import { AudioTaskInit } from "@pmate/meta"
import { Logger } from "@pmate/utils"
import { useCallback, useEffect, useState } from "react"
import {
  AudioPlayer,
  AudioPlayerEvents,
  AudioPlayState,
} from "@sdk/util/audio"

const logger = Logger.getDebugger("asr")
export const usePlayAudio = (audioPlayer: AudioPlayer) => {
  const [state, setState] = useState<AudioPlayState>(audioPlayer.getState())

  useEffect(() => {
    const s1 = audioPlayer.on(
      AudioPlayerEvents.StateChanged,
      (body: { state: AudioPlayState }) => {
        const { state } = body
        setState(state)
      }
    )

    return () => {
      s1()
    }
  }, [audioPlayer])

  const play = useCallback(
    async (...inits: AudioTaskInit[]) => {
      const tasks = await audioPlayer.createTask(...inits)
      logger.log({ tasks })
      for (const task of tasks) {
        await audioPlayer.play(task)
      }
    },
    [audioPlayer]
  )

  const prepare = useCallback(
    async (...inits: AudioTaskInit[]) => {
      await audioPlayer.createTask(...inits)
    },
    [audioPlayer]
  )

  const pause = useCallback(() => {
    audioPlayer.pause()
  }, [audioPlayer])

  const resume = useCallback(() => {
    audioPlayer.resume()
  }, [audioPlayer])

  const stop = useCallback(() => {
    audioPlayer.stop()
  }, [audioPlayer])

  useEffect(() => {
    return () => {
      stop()
    }
  }, [])

  return { play, prepare, playState: state, pause, resume, stop }
}