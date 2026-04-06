import type { AudioTask } from "./AudioPlayer"

export enum AudioEvents {
  Playing,
  Paused,
  Stopped,
  PlayEnd,
  Progress,
}

export enum AudioPlayerEvents {
  StateChanged,
  WordIndexUpdate,
}

export enum AudioPlayState {
  Playing = "Playing",
  Paused = "Paused",
  Stopped = "Stopped",
}

export type AudioEventsParams<T extends AudioEvents> = {
  task: AudioTask
} & (T extends AudioEvents.Playing
  ? {}
  : T extends AudioEvents.Paused
  ? {}
  : T extends AudioEvents.Stopped
  ? {}
  : T extends AudioEvents.Progress
  ? { current: number; total: number; wordIndex?: string | number }
  : {})
