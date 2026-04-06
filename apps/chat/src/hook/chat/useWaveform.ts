import { Logger } from "@pmate/utils"
import { useCallback, useEffect, useRef } from "react"

import { MicState } from "@/component/chat/MicStateManage"
import { useMicState } from "@/hook/useMicState"

const logger = Logger.getDebugger("useWaveform")

interface UseWaveformOptions {
  smoothFactor?: number
  amplitudeBoost?: number
}

export const useWaveform = (
  analyzerNode: AnalyserNode | null,
  { smoothFactor = 0.2, amplitudeBoost = 3 }: UseWaveformOptions = {}
) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const prevHeightsRef = useRef<number[]>([])
  const micState = useMicState()
  const isRecording = micState === MicState.RECORDING

  // Function to draw waveform using a fixed number of vertical rectangles
  const drawWaveform = useCallback(() => {
    if (!analyzerNode || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const bufferLength = analyzerNode.fftSize
    const dataArray = new Uint8Array(bufferLength)
    analyzerNode.getByteTimeDomainData(dataArray)

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Styling matches the original WaveAnimation span layout
    const numRects = 20
    const rectWidth = 6
    const gap = 6
    const totalWidth = numRects * rectWidth + (numRects - 1) * gap
    const startX = (canvas.width - totalWidth) / 2
    const baseHeight = canvas.height * 0.5 // matches original h-7 (28px when canvas is 56px tall)
    const minHeight = baseHeight * 0.6
    const maxHeight = Math.min(canvas.height, baseHeight * 1.8)

    // Calculate how many time-domain samples map to each rectangle
    const samplesPerRect = Math.max(1, Math.floor(bufferLength / numRects))

    ctx.fillStyle = "#9C6BFF"
    ctx.globalAlpha = 0.9
    ctx.imageSmoothingEnabled = true
    ctx.lineCap = "round"

    // lazily seed the previous heights so smoothing starts from current baseline
    if (prevHeightsRef.current.length !== numRects) {
      prevHeightsRef.current = new Array(numRects).fill(baseHeight)
    }

    // Draw the vertical rectangles (bars)
    for (let i = 0; i < numRects; i++) {
      let sumSquares = 0
      let maxAmplitude = 0
      let samplesCounted = 0
      for (let j = 0; j < samplesPerRect; j++) {
        const index = i * samplesPerRect + j
        if (index < dataArray.length) {
          const sample = (dataArray[index] - 128) / 128
          sumSquares += sample * sample
          maxAmplitude = Math.max(maxAmplitude, Math.abs(sample))
          samplesCounted++
        }
      }

      const rms =
        samplesCounted > 0 ? Math.sqrt(sumSquares / samplesCounted) : 0
      const amplitude = Math.max(rms, maxAmplitude) // favor whichever shows more motion
      const normalized = Math.min(1, amplitude * amplitudeBoost) // boost visually while clamping
      const targetHeight = minHeight + normalized * (maxHeight - minHeight)
      const previousHeight = prevHeightsRef.current[i]
      const barHeight =
        previousHeight + (targetHeight - previousHeight) * smoothFactor
      prevHeightsRef.current[i] = barHeight
      const x = startX + i * (rectWidth + gap)
      const y = (canvas.height - barHeight) / 2

      ctx.fillRect(x, y, rectWidth, barHeight)
    }
  }, [analyzerNode, smoothFactor, amplitudeBoost])

  useEffect(() => {
    let animationId: number | null = null

    if (isRecording && analyzerNode) {
      const animate = () => {
        drawWaveform()
        animationId = requestAnimationFrame(animate)
      }
      animationId = requestAnimationFrame(animate)
    } else if (!isRecording && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d")
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      prevHeightsRef.current = []
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [isRecording, analyzerNode, drawWaveform])

  return { canvasRef }
}
