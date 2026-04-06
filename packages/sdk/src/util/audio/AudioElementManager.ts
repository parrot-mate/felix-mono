import { Emitter, Logger, wait } from "@pmate/utils"
import { AudioEvents } from "./audio.types"
import type { AudioTask } from "./AudioPlayer"

const logger = Logger.getDebugger("AudioElementManager")
export class AudioElementManager extends Emitter<AudioEvents> {
  private audio = new Audio()
  private currentTask?: AudioTask

  constructor() {
    super()
  }

  public async play(
    task: AudioTask,
    options: {
      start: number
      speed: number
    }
  ) {
    this.currentTask = task
    if (this.audio) {
      this.audio.pause()
      await wait(50)
    }
    return new Promise<void>((resolve) => {
      const url = task.link
      if (!url) {
        throw new Error("Audio link is not available")
      }
      const handleEnd = () => {
        handleTimeUpdate()
        handleStop()
      }

      const handleStop = () => {
        this.audio.onended = null
        this.audio.oncancel = null
        this.audio.onpaste = null
        this.audio.onerror = null
        this.audio.ontimeupdate = null
        if (this.audio.ended) {
          logger.log("stop ended")
        }
        this.stop()
        resolve()
      }

      const handlePause = () => {
        if (this.audio.ended) {
          this.stop()
        } else {
          this.pause()
        }
        resolve()
      }

      const handleTimeUpdate = () => {
        const currentTime = this.audio.currentTime
        const totalTime = this.audio.duration
        this.emit(AudioEvents.Progress, {
          current: currentTime,
          total: totalTime,
          task,
        })
      }

      this.audio.onended = handleEnd
      this.audio.oncancel = handleStop
      this.audio.onpause = handlePause
      this.audio.onerror = handleStop
      this.audio.ontimeupdate = handleTimeUpdate

      this.audio.src = url
      if (options.start) {
        this.audio.currentTime = options.start
      }
      this.audio.playbackRate = options.speed
      this.audio.play().catch(handleStop)
      this.emit(AudioEvents.Playing, {
        task,
      })
    })
  }

  public resume() {
    this.audio.play()
    this.emit(AudioEvents.Playing, {
      task: this.currentTask!,
    })
  }

  public pause() {
    this.audio.pause()
    this.emit(AudioEvents.Paused, {
      task: this.currentTask!,
    })
  }

  public stop() {
    this.audio.pause()
    this.audio.currentTime = 0
    this.emit(AudioEvents.Stopped, {
      task: this.currentTask!,
    })
  }
}
