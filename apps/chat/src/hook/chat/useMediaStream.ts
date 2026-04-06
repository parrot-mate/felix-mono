import { Logger } from "@pmate/utils"
import { atom, useAtomValue } from "jotai"
import { useEffect, useRef, useState } from "react"
import { Recorder, RecorderEvents } from "@/util/audio/Recorder"

// Logging setup
const logger = Logger.getDebugger("useMediaStream")

export const recorderAtom = atom(() => {
  return new Recorder()
})

type MediaStreamOptions = {
  onStart?: () => void
  onAbort?: () => void
  onData?: (audioBlob: Blob) => void
  onEnd?: (blob: Blob) => void
}
export const useMediaStream = (options: MediaStreamOptions) => {
  const [isRecording, setIsRecording] = useState(false)
  const recorder = useAtomValue(recorderAtom)
  const dataChunks = useRef<Blob[]>([])
  // Handle recorder events
  useEffect(() => {
    const sub1 = recorder.on(RecorderEvents.Start, () => {
      if (options.onStart) {
        options.onStart()
      }
      dataChunks.current = []
      setIsRecording(true)
    })
    const sub2 = recorder.on(RecorderEvents.Stop, () => {
      setIsRecording(false)
      const blob = new Blob(dataChunks.current, {
        type: "audio/pcm;rate=16000",
      })
      logger.log("record stoped", blob.size)

      if (blob.size < 1024 * 8) {
        options.onAbort && options.onAbort()
      } else {
        logger.log("end with blob size", blob.size)
        options.onEnd && options.onEnd(blob)
      }
      dataChunks.current = []
    })
    const sub3 = recorder.on(RecorderEvents.Data, (data: Blob) => {
      if (options.onData) {
        options.onData(data)
      }
      dataChunks.current.push(data)
    })

    return () => {
      logger.log("unsub")

      sub1()
      sub2()
      sub3()
    }
  }, [])

  const startRecording = () => {
    // const ctx1 = new AudioContext()
    recorder.startRecording()
  }

  const stopRecording = () => {
    recorder.stopRecording()
  }

  useEffect(() => {
    return () => {
      recorder.dispose()
    }
  }, [])

  return {
    isRecording,
    startRecording,
    stopRecording,
  }
}
