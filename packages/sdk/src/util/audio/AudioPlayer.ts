import {
  calculateSHA1Hash,
  Emitter,
  Logger,
  uniqHashForVoice,
} from "@pmate/utils"
import {
  AudioTaskInit,
  AudioTimepoints,
  LangShort,
  Voice,
  VoiceList,
} from "@pmate/meta"
import { aiGenTTSAudio as fetchTTSAudio } from "@sdk/api/pipeline/resource/aiGenTTSAudio"
import { MsgDB } from "@sdk/util/MsgDB"
import {
  AudioEvents,
  AudioEventsParams,
  AudioPlayerEvents,
  AudioPlayState,
} from "./audio.types"
import { AudioElementManager } from "./AudioElementManager"

export interface AudioTask {
  init: {
    voice: string
    text: string
    lang: LangShort
    instructions: string
    timePoints: boolean
  }
  timePoints?: AudioTimepoints
  link?: string
  textHash: string
  hash: string
}

const logger = Logger.getDebugger("AudioPlayer")

enum PlayPriority {
  BACKGROUND = -1,
  LOW = 100,
  Medium = 200,
  High = 300,
}

export enum AudioPlayers {
  BGPlayer,
  WordPlayer,
  BookPlayer,
  SystemPlayer,
  ChatPlayer,
}

export const AudioPlayerSettings = {
  [AudioPlayers.BGPlayer]: {
    priority: PlayPriority.BACKGROUND,
    timePoints: false,
  },
  [AudioPlayers.WordPlayer]: {
    priority: PlayPriority.LOW,
    defaultVoice: VoiceList.OPEN_AI_Alloy,
    timePoints: false,
  },
  [AudioPlayers.BookPlayer]: {
    priority: PlayPriority.LOW,
    timePoints: true,
  },
  [AudioPlayers.SystemPlayer]: {
    priority: PlayPriority.Medium,
    timePoints: false,
  },
  [AudioPlayers.ChatPlayer]: {
    priority: PlayPriority.Medium,
    timePoints: false,
  },
} satisfies Record<AudioPlayers, AudioPlayerSetting>

interface AudioPlayerSetting {
  priority: PlayPriority
  defaultVoice?: Voice
  timePoints?: boolean
}

const audioChannel = new Emitter<AudioEvents>()
export class AudioPlayer extends Emitter<AudioPlayerEvents> {
  private audio = new AudioElementManager()
  private state: AudioPlayState = AudioPlayState.Stopped
  public getState() {
    return this.state
  }

  public setVoice(voice: Voice) {
    this.voice = voice
  }

  private getPriority() {
    return AudioPlayerSettings[this.name].priority
  }

  constructor(
    private name: AudioPlayers,
    private speed: number,
    private voice?: Voice
  ) {
    super()
    this.audio.onAll((event) => {
      switch (event.topic) {
        case AudioEvents.Progress: {
          let wordIndex = -1
          const { current, task } =
            event.body as AudioEventsParams<AudioEvents.Progress>

          if (task.timePoints) {
            const { timePoints } = task
            wordIndex = timePoints.findIndex((p) => p.timeSeconds > current)
          }

          const tp = (task.timePoints || [])[wordIndex]
          if (tp) {
            this.emit(AudioPlayerEvents.WordIndexUpdate, {
              ...event.body,
              wordIndex: tp.wordIndex,
            })
            logger.log("emit", tp)
          }
          break
        }
        case AudioEvents.Paused: {
          this.setState(AudioPlayState.Paused)
          break
        }
        case AudioEvents.Stopped: {
          logger.log("audio stopped")
          this.setState(AudioPlayState.Stopped)
          this.emit(AudioPlayerEvents.WordIndexUpdate, {
            wordIndex: -1,
          })
          break
        }
        case AudioEvents.Playing: {
          this.setState(AudioPlayState.Playing)
          break
        }
        default:
      }

      if (event.topic === AudioEvents.Playing) {
        logger.log(
          `received from audio[${name}]`,
          AudioEvents.Playing,
          event.body
        )
        audioChannel.emit(AudioEvents.Playing, {
          name,
          priority: this.getPriority(),
        })
      }
    })

    audioChannel.on(
      AudioEvents.Playing,
      (body: { name: AudioPlayers; priority: PlayPriority }) => {
        if (this.state !== AudioPlayState.Playing) {
          return
        }
        const { name, priority } = body
        if (name !== this.name) {
          if (this.getPriority() === PlayPriority.BACKGROUND) {
            return
          }

          if (this.getPriority() <= priority) {
            this.pause()
          }
        }
      }
    )
  }

  private setState(state: AudioPlayState) {
    if (this.state !== state) {
      this.state = state
      this.emit(AudioPlayerEvents.StateChanged, {
        state,
        name: this.name,
      })
    }
  }

  private static async _hash(task: AudioTask) {
    const voice = VoiceList[task.init.voice as keyof typeof VoiceList]!
    return uniqHashForVoice(
      voice.provider,
      task.init.text,
      voice.name,
      task.init.lang,
      task.init.instructions,
      task.init.timePoints
    )
  }

  private __cachePrepare: Map<string, AudioTask> = new Map()
  private async prepare(task: AudioTask) {
    let cached = this.__cachePrepare.get(task.hash)

    if (!cached) {
      await this.ttsPrepare(task)
      cached = task
      this.__cachePrepare.set(task.hash, task)
    }
    return cached
  }

  private async ttsPrepare(task: AudioTask) {
    logger.log("prepare", task)
    const url = await fetchTTSAudio(task.init)
    task.link = url?.audio
    task.timePoints = url?.timePoints
  }

  public async createTask(...taskInits: AudioTaskInit[]) {
    const tasks: AudioTask[] = []
    for (const init of taskInits) {
      if (!init.text.length) {
        continue
      }

      const voice =
        VoiceList[init.voice as keyof typeof VoiceList] || this.voice
      if (!voice) {
        throw new Error(`Voice not found: ${init.voice}`)
      }
      const init1 = {
        ...init,
        voice: voice.key,
        lang: init.lang || "en",
        instructions: init.instructions || "",
        timePoints: init.timePoints || false,
      }
      const task: AudioTask = {
        init: init1,
        textHash: await calculateSHA1Hash(init.text),
        hash: "",
      }
      task.hash = await AudioPlayer._hash(task)
      tasks.push(task)
    }
    tasks.forEach((task) => this.prepare(task))
    return tasks
  }

  public async play(task: AudioTask, start: number = 0) {
    this.setState(AudioPlayState.Playing)
    try {
      task = await this.prepare(task)
      await this.audio.play(task, {
        start,
        speed: this.speed,
      })
    } catch (ex) {
      this.setState(AudioPlayState.Stopped)
    }
  }

  public async loadDuration(task: AudioTask) {
    const info = await MsgDB.AudioInfo.get(task.hash)
    if (info.isJust()) {
      return info.unwrap().duration
    }

    await this.ttsPrepare(task)
    const link = task.link
    const audio = new Audio(link)
    return new Promise<number>((resolve) => {
      audio.load()
      audio.onloadedmetadata = (data) => {
        const target = data.target as HTMLAudioElement
        const duration = target.duration as number
        MsgDB.AudioInfo.save(task.hash, {
          duration: audio.duration,
        })
        resolve(duration)
      }
    })
  }

  public resume() {
    this.audio.resume()
  }

  public pause() {
    this.audio.pause()
  }

  public stop() {
    this.audio.stop()
  }

  public getVoice() {
    return this.voice
  }
}
