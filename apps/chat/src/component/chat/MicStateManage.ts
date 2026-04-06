import { Emitter, Logger } from "@pmate/utils"

import { Recorder, RecorderEvents } from "@/util/audio/Recorder"

export enum MicState {
  Idle,
  Initializing,
  RECORDING,
  CANCEL,
}

export enum MicEvents {
  STATE_CHANGED,
  DATA,
  FINISHED,
  ABORT,
  ERROR,
}

const logger = Logger.getDebugger("MicStateManage")

export class MicStateManage extends Emitter<MicEvents> {
  private recorder = new Recorder()
  private state = MicState.Idle
  private chunks: Blob[] = []
  private stream: MediaStream | undefined
  private isDisposing = false

  constructor() {
    super()
  }

  public init = () => {
    logger.log("MicStateManage init", MicState[this.state])
    if (this.state !== MicState.Idle) {
      throw new Error(`Invalid state: ${MicState[this.state]}`)
    }
    this.state = MicState.Idle

    this.recorder.on(RecorderEvents.Data, (data: Blob) => {
      this.chunks.push(data)
      this.emit(MicEvents.DATA, data)
    })
    this.recorder.on(RecorderEvents.Stop, () => {
      const blob = new Blob(this.chunks, {
        type: "audio/pcm;rate=16000",
      })
      logger.log("record stopped", blob.size)

      if (blob.size < 1024 * 8) {
        this.abort()
      } else {
        logger.log("end with blob size", blob.size)
        this.finish(blob)
      }
    })
    this.recorder.on(RecorderEvents.Error, (error: Error) => {
      this.handleRecorderError(error)
    })
  }

  public async warmUp() {
    if (this.state !== MicState.Idle) {
      return
    }
    try {
      // this.init()
      // const stream = await this.ensureStream()
      // await this.recorder.init(stream)
      await this.recorder.ensureAudioGraph()
      // this.releaseStream()
    } catch (error) {
      const normalized = normalizeError(error)
      logger.error("Mic warm up failed", normalized)
      this.emit(MicEvents.ERROR, normalized)
      throw normalized
    }
  }

  private shouldRefreshStream() {
    if (!this.stream) {
      return true
    }
    const tracks = this.stream.getAudioTracks()
    if (tracks.length === 0) {
      return true
    }
    return tracks.some((track) => track.readyState !== "live")
  }

  private releaseStream() {
    this.recorder.detachStream()
    if (!this.stream) {
      return
    }
    this.stream.getTracks().forEach((track) => {
      try {
        track.stop()
      } catch (error) {
        logger.log("Failed to stop track", error)
      }
    })
    this.stream = undefined
  }

  private pauseStream() {
    if (this.stream) {
      // Pause all tracks to hide the OS mic icon (track.enabled = false)
      this.stream.getTracks().forEach((track) => {
        track.enabled = false // This keeps the stream active but hides the mic icon
      })
    }
  }

  private resumeStream() {
    if (this.stream) {
      // Resume all tracks to re-enable the mic icon when recording starts again
      this.stream.getTracks().forEach((track) => {
        track.enabled = true // Re-enable the track to show the mic icon
      })
    }
  }

  private async ensureStream() {
    if (this.shouldRefreshStream()) {
      this.recorder.stopRecording()
      this.releaseStream()
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        })
      } catch (error) {
        throw normalizeError(error)
      }
    }
    if (!this.stream) {
      throw new Error("Microphone stream unavailable")
    }
    return this.stream
  }

  private reset() {
    this.setState(MicState.Idle)
    this.chunks = []
  }

  finish(blob: Blob) {
    this.emit(MicEvents.FINISHED, blob)
    this.reset()
  }

  abort() {
    logger.log("abort>", this.state)
    if (this.state === MicState.Idle) {
      return
    }
    if (this.state === MicState.Initializing) {
      this.recorder.stopRecording()
      this.recorder.detachStream()
      this.pauseStream()
      this.emit(MicEvents.ABORT)
      this.reset()
      return
    }
    if (this.state !== MicState.RECORDING) {
      logger.log("Abort called in unexpected state", this.state)
      return
    }
    logger.log("abort recording")

    this.recorder.stopRecording()
    this.recorder.detachStream()
    this.pauseStream()

    this.emit(MicEvents.ABORT)
    this.reset()
  }

  stop() {
    if (this.state === MicState.Initializing) {
      // Treat premature stop (before recording starts) as an abort so listeners clean up.
      this.abort()
      return
    }
    if (this.state !== MicState.RECORDING) {
      return
    }
    logger.log("stop recording")
    this.recorder.stopRecording()
    this.recorder.detachStream()
    this.pauseStream()
    this.setState(MicState.Idle)
  }

  async start() {
    if (
      this.state === MicState.Initializing ||
      this.state === MicState.RECORDING
    ) {
      return
    }
    this.setState(MicState.Initializing)
    try {
      const stream = await this.ensureStream()
      if (this.state === MicState.Idle) {
        // aborted while waiting for stream
        this.abort()
        return
      }
      logger.log("state with state", MicState[this.state])

      await this.recorder.init(stream)
      this.resumeStream()
      await this.recorder.startRecording()
      logger.log("start>m1", this.state)
      this.setState(MicState.RECORDING)
    } catch (error) {
      this.handleStartFailure(error)
    }
  }

  setState(state: MicState) {
    this.state = state
    this.emit(MicEvents.STATE_CHANGED, { state })
  }

  getState() {
    return this.state
  }

  dispose() {
    logger.log("MicStateManage dispose")
    if (this.isDisposing) {
      return
    }
    this.isDisposing = true
    try {
      this.recorder.stopRecording()
      this.releaseStream()
      this.recorder.dispose()
      this.setState(MicState.Idle)
    } finally {
      this.isDisposing = false
      this.recorder.clearListeners()
    }
  }

  getStream() {
    return this.stream
  }

  private handleRecorderError(error: Error) {
    logger.error("Recorder error", error)
    if (this.state !== MicState.Idle) {
      this.abort()
    } else {
      this.reset()
    }
    this.emit(MicEvents.ERROR, error)
  }

  private handleStartFailure(error: unknown) {
    const normalized = normalizeError(error)
    logger.error("Mic start failed", normalized)
    if (this.state !== MicState.Idle) {
      this.abort()
    } else {
      this.reset()
    }
    this.emit(MicEvents.ERROR, normalized)
  }
}

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}
