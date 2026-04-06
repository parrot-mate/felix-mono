import type { Difficulty } from "./enums"
import type { LangShort } from "./lang.types"
import type { PendingLog } from "./logs.types"
import type {
  GlobalReaderState,
  PickUp,
  ReaderState,
  ReadingBook,
  ReadingProgress,
} from "./reading.types"
import type { Voice } from "./types"

export interface UserSettings {
  intensive: boolean
  advancedMode: boolean
  bilingual: boolean
  fontColor: string
  backgroundColor: string
  books: string[]
  autoread: boolean
  playSpeed: number
  scrollDirection: "vertical" | "horizontal"
  companion: string
  difficulty: Difficulty
  "chatVoice@v2": Voice
  uiLang: LangShort
  motherTongue: LangShort
}

export interface UserLocalSettings {
  fontSize: number
}

export interface UserPendingLogs {
  logs: PendingLog<any>[]
}

export type UserLocalSettingsValue =
  | string
  | number
  | ReadingProgress
  | ReaderState
  | ReadingBook
  | GlobalReaderState
  | PickUp[]
  | UserPendingLogs
