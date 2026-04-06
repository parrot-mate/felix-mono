import { useEffect, useState } from "react"

import { useMicContext } from "./useMicContext"

export const useMicAnalyzer = (active: boolean) => {
  const { manager } = useMicContext()
  const [analyzerNode, setAnalyzerNode] = useState<AnalyserNode | null>(null)

  useEffect(() => {
    if (!active) {
      setAnalyzerNode(null)
      return
    }

    let audioContext: AudioContext | null = null
    let sourceNode: MediaStreamAudioSourceNode | null = null
    let disposed = false
    let retryId: ReturnType<typeof setTimeout> | null = null

    const setupAnalyzer = async () => {
      const stream = manager.getStream()
      if (!stream) {
        retryId = setTimeout(setupAnalyzer, 200)
        return
      }

      try {
        audioContext = new AudioContext()
        const analyser = audioContext.createAnalyser()
        analyser.smoothingTimeConstant = 1
        analyser.fftSize = 2048

        sourceNode = audioContext.createMediaStreamSource(stream)
        sourceNode.connect(analyser)

        if (!disposed) {
          setAnalyzerNode(analyser)
        }
      } catch (error) {
        console.error("Failed to init mic analyzer", error)
      }
    }

    setupAnalyzer()

    return () => {
      disposed = true
      if (retryId) {
        clearTimeout(retryId)
      }
      setAnalyzerNode(null)
      if (sourceNode) {
        try {
          sourceNode.disconnect()
        } catch (error) {
          console.error("Failed to disconnect source node", error)
        }
      }
      if (audioContext) {
        audioContext.close().catch(() => {
          // ignore close errors
        })
      }
    }
  }, [manager, active])

  return analyzerNode
}
