import { Emitter, Logger, memoizeAsync } from "@pmate/utils"

export enum RecorderEvents {
  Start = "start",
  Stop = "stop",
  Data = "data",
  Error = "error",
}

const logger = Logger.getDebugger("Recorder")

export class Recorder extends Emitter<RecorderEvents> {
  private audioContext?: AudioContext
  private mediaStream?: MediaStream
  private mediaStreamSource?: MediaStreamAudioSourceNode
  private recorderProcessorNode?: AudioWorkletNode
  private silentGainNode?: GainNode
  private isRecording = false
  private readonly setupAudioGraph = memoizeAsync(
    async () => {
      try {
        await fetch("/chat/recorder-processor.js")
        this.audioContext = new AudioContext({ sampleRate: 16000 })
        logger.log("Audio context and AudioWorklet initialized")
        await this.audioContext.audioWorklet.addModule(
          "/chat/recorder-processor.js"
        )
        this.recorderProcessorNode = new AudioWorkletNode(
          this.audioContext,
          "recorder-processor"
        )
        this.silentGainNode = this.audioContext.createGain()
        this.silentGainNode.gain.value = 0
        this.recorderProcessorNode.connect(this.silentGainNode)
        this.silentGainNode.connect(this.audioContext.destination)

        this.recorderProcessorNode.port.onmessage = (event) => {
          if (!this.isRecording) return

          const { type, data } = event.data
          if (type === "pcm") {
            const blob = new Blob([data])
            logger.log("Data received", blob.size)
            this.emit(RecorderEvents.Data, blob)
          }
        }
      } catch (error) {
        logger.error("Error initializing recorder", error)
        this.emit(RecorderEvents.Error, toError(error))
        this.dispose()
        throw error
      }
    },
    { isValid: () => true }
  )

  constructor() {
    super()
  }

  public initialized = false

  public async init(stream: MediaStream) {
    await this.ensureAudioGraph()
    this.attachStream(stream)
    this.initialized = true
  }

  public async ensureAudioGraph() {
    await this.setupAudioGraph()
  }

  private attachStream(stream: MediaStream) {
    this.detachStream()
    this.mediaStream = stream
    this.mediaStream
      .getAudioTracks()
      .forEach((track) => (track.enabled = false))

    if (!this.audioContext || !this.recorderProcessorNode) {
      throw new Error("Recorder audio graph is not ready")
    }

    this.mediaStreamSource = this.audioContext.createMediaStreamSource(
      this.mediaStream
    )
    this.mediaStreamSource.connect(this.recorderProcessorNode)
  }

  public detachStream(options?: { stopTracks?: boolean }) {
    if (this.mediaStreamSource) {
      try {
        this.mediaStreamSource.disconnect()
      } catch (error) {
        logger.error("Failed to disconnect media stream source", error)
      }
      this.mediaStreamSource = undefined
    }

    if (this.mediaStream) {
      if (options?.stopTracks) {
        this.mediaStream.getTracks().forEach((track) => track.stop())
      } else {
        this.mediaStream.getAudioTracks().forEach((track) => {
          track.enabled = false
        })
      }
    }

    this.mediaStream = undefined
  }

  public async startRecording() {
    if (this.isRecording) {
      return
    }
    if (
      !this.audioContext ||
      !this.mediaStream ||
      !this.recorderProcessorNode
    ) {
      const error = new Error("Recorder not initialized")
      this.emit(RecorderEvents.Error, error)
      throw error
    }
    this.isRecording = true
    try {
      this.mediaStream
        .getAudioTracks()
        .forEach((track) => (track.enabled = true))

      // Resume context and trigger the start tone inside the user gesture.
      playStartRecordingSound(this.audioContext)
      await this.audioContext.resume()

      logger.log("start recording")
      this.emit(RecorderEvents.Start)
    } catch (error) {
      logger.error("Error starting recorder", error)
      this.emit(RecorderEvents.Error, toError(error))
      this.isRecording = false
      throw error
    }
  }

  public stopRecording() {
    if (!this.isRecording) return
    this.isRecording = false

    this.emit(RecorderEvents.Stop)
    playSendMessageSound()
  }

  public dispose() {
    this.isRecording = false

    this.detachStream({ stopTracks: true })

    this.recorderProcessorNode?.disconnect()
    this.silentGainNode?.disconnect()

    this.audioContext?.close()

    this.mediaStream = undefined
    this.recorderProcessorNode = undefined
    this.audioContext = undefined
    this.mediaStreamSource = undefined
    this.silentGainNode = undefined
    this.setupAudioGraph.cache.clear()
    this.initialized = false
  }

  public get isRecordingStatus() {
    return this.isRecording
  }
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}

async function playStartRecordingSound(ctx?: AudioContext): Promise<void> {
  const audioContext = ctx ?? new AudioContext()
  const shouldCloseContext = !ctx

  if (audioContext.state === "suspended") {
    try {
      await audioContext.resume()
    } catch (error) {
      logger.error("Failed to resume start sound context", error)
    }
  }

  const beepDuration = 0.1 // 100ms
  const pauseDuration = 0.05 // 50ms pause
  const frequencies = [400, 600] // rising tones (low → high)

  return new Promise<void>((resolve) => {
    frequencies.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.type = "sine"
      oscillator.frequency.value = frequency

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      const startTime =
        audioContext.currentTime + index * (beepDuration + pauseDuration)

      gainNode.gain.setValueAtTime(0.2, startTime)
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        startTime + beepDuration
      )

      oscillator.start(startTime)
      oscillator.stop(startTime + beepDuration)

      // if this is the last beep, resolve when it ends
      if (index === frequencies.length - 1) {
        oscillator.onended = () => {
          if (shouldCloseContext) {
            audioContext.close().catch(() => {
              // ignore close errors
            })
          }
          resolve()
        }
      }
    })
  })
}

function playSendMessageSound() {
  const ctx = new AudioContext()

  // Define parameters for each beep
  const beepDuration = 0.1 // each beep lasts 0.1 seconds
  const pauseDuration = 0.05 // 50ms pause between beeps
  const frequencies = [600, 400] // frequencies for the two beeps (in Hz)

  frequencies.forEach((frequency, index) => {
    // Create oscillator and gain nodes for this beep
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.type = "sine"
    oscillator.frequency.value = frequency

    // Calculate the start time offset for each beep
    const startTime = ctx.currentTime + index * (beepDuration + pauseDuration)

    // Set up a quick fade out for a smoother beep end
    gainNode.gain.setValueAtTime(0.2, startTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + beepDuration)

    // Schedule the beep
    oscillator.start(startTime)
    oscillator.stop(startTime + beepDuration)
  })
}
