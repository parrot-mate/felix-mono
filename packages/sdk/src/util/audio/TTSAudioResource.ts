import { Emitter } from "@pmate/utils"
import { AudioTaskInit, AudioTimepoints } from "@pmate/meta"

import { aiGenTTSAudio as fetchTTSAudio } from "@sdk/api/pipeline/resource/aiGenTTSAudio"
import { TranslationService } from "@sdk/api/TranslationService"
import { AudioElementManager } from "./AudioElementManager"
import type { AudioTask } from "./AudioPlayer"
import { AudioEvents, type AudioEventsParams } from "./audio.types"

type LoadedAudioResource = {
  link: string
  timePoints?: AudioTimepoints
}

export enum TTSAudioResourceEvents {
  TimePointUpdate,
}

type TimePointEventBody = {
  index: number
  timePoint: AudioTimepoints[number]
}

export class TTSAudioResource extends Emitter<TTSAudioResourceEvents> {
  private readonly audioManager = new AudioElementManager()
  private loaded?: LoadedAudioResource
  private readonly loadResource = this.fetchResource.bind(this)
  private activeTimePoints?: AudioTimepoints
  private lastTimePointIndex = -1
  private resolvedInit?: AudioTaskInit

  constructor(private readonly init: AudioTaskInit) {
    super()
    this.audioManager.on<AudioEventsParams<AudioEvents.Progress>>(
      AudioEvents.Progress,
      (payload) => this.handleProgress(payload)
    )
  }

  public async load() {
    if (this.loaded) {
      return this.loaded
    }

    const result = await this.loadResource()
    this.loaded = result
    return result
  }

  public async play(options?: { start?: number; speed?: number }) {
    const { start = 0, speed = 1 } = options || {}
    const resource = await this.load()
    this.activeTimePoints = resource.timePoints
    this.lastTimePointIndex = -1

    const resolvedInit = await this.resolveInit()
    const voice = resolvedInit.voice
    if (!voice) {
      throw new Error("voice is required before playing TTS audio")
    }

    const task: AudioTask = {
      init: {
        voice,
        text: resolvedInit.text,
        lang: resolvedInit.lang || "en",
        instructions: resolvedInit.instructions || "",
        timePoints: resolvedInit.timePoints || false,
      },
      textHash: "",
      hash: "",
      link: resource.link,
      timePoints: resource.timePoints,
    }

    await this.audioManager.play(task, {
      start,
      speed,
    })
  }

  public pause() {
    this.audioManager.pause()
  }

  public resume() {
    this.audioManager.resume()
  }

  public stop() {
    this.audioManager.stop()
    this.lastTimePointIndex = -1
  }

  private handleProgress({
    current,
  }: AudioEventsParams<AudioEvents.Progress>) {
    if (!this.activeTimePoints?.length) {
      return
    }

    const nextIndex = this.activeTimePoints.findIndex(
      (tp) => tp.timeSeconds > current
    )
    if (nextIndex === -1 || nextIndex === this.lastTimePointIndex) {
      return
    }

    const timePoint = this.activeTimePoints[nextIndex]
    if (!timePoint) {
      return
    }

    this.lastTimePointIndex = nextIndex
    this.emit<TimePointEventBody>(TTSAudioResourceEvents.TimePointUpdate, {
      index: nextIndex,
      timePoint,
    })
  }

  private async fetchResource(): Promise<LoadedAudioResource> {
    const resolvedInit = await this.resolveInit()
    const voice = resolvedInit.voice
    if (!voice) {
      throw new Error("voice is required to load TTS audio")
    }

    const response = await fetchTTSAudio({
      ...resolvedInit,
      voice,
    })

    if (!response?.audio) {
      throw new Error("Failed to load TTS audio resource")
    }

    return {
      link: response.audio,
      timePoints: response.timePoints,
    }
  }

  public getGroup() {
    return this.resolvedInit?.group ?? this.init.group
  }

  private async resolveInit(): Promise<AudioTaskInit> {
    if (this.resolvedInit) {
      return this.resolvedInit
    }

    const voice = this.init.voice
    if (!voice) {
      throw new Error("voice is required to load TTS audio")
    }

    const { translation, ...rest } = this.init
    let text = this.init.text
    let lang = rest.lang ?? translation?.to

    if (translation) {
      const translatedText =
        translation.accuracy === "accurate"
          ? await TranslationService.aiTranslate(
              translation.from,
              translation.to,
              text,
              translation.context || ""
            )
          : await TranslationService.apiTranslation(
              translation.from,
              translation.to,
              text
            )

      if (translatedText) {
        text = translatedText
      }
    }

    this.resolvedInit = {
      ...rest,
      voice,
      text,
      lang,
      translation: translation ?? undefined,
    }

    return this.resolvedInit
  }
}
