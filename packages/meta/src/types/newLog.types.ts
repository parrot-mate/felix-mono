import { VolcabularyAction } from "./types"

export enum LogType {
  Reading,
  UserNotes,
  Vocabulary,
  Mint,
  UserSettings,
  Books,
  ContextQA,
}

export type Log =
  | BaseLog<LogType.Reading>
  | BaseLog<LogType.UserNotes>
  | BaseLog<LogType.Vocabulary>
  | BaseLog<LogType.Mint>
  | BaseLog<LogType.UserSettings>
  | BaseLog<LogType.Books>
  | BaseLog<LogType.ContextQA>

export type LogTypeMap = {
  [LogType.Reading]: ReadingLogV3
  [LogType.UserNotes]: UserNotes
  [LogType.Vocabulary]: VolcabularyLogV3
  [LogType.Mint]: MintLog
  [LogType.UserSettings]: UserSettingLogV1
  [LogType.Books]: BooksLog
  [LogType.ContextQA]: ContextQAItem
}

export type BaseLog<T extends keyof LogTypeMap> = {
  type: T
  t: number
  user: string
  data: LogTypeMap[T]
  hash: string
  l?: number
}

export type UserSettingLogV1 = {
  key: string
  value: any
}

export interface ContextQAItem {
  role: "user" | "assistant"
  text: string
  bookId: string
  paragraphId: number
  key: string
}

export interface BooksLog {
  op: number // 0-add/update, 1-delete
  book: import("./types").LibraryItem
}

export type ReadingLogV3 = {
  book: string // book id
  pid: number // paragraph
  wc: number // word count
  time?: [number, number]
  picked: string[]
  uniqWords: string[]
}

export interface UserNotes {
  title: string
  content: string
  op: number // 0-add 1-delete
}

export interface VolcabularyLogV3 {
  word: string
  action: VolcabularyAction
  book: {
    id: string
    title: string
  }
  sentence: string
}

export interface AchievementLogV3 {
  id: AchiementsType // achievements ID
  n: number // number
  nft: 0 | 1 // is NFT
  exts?: (string | number)[] // extra infos
}

export enum AchiementsType {
  coin = 1,
}

/* Agg types */

export type Vocabulary = {
  entryTime: number
  word: string
  pickups: number
  reviews: number
  deleted: boolean
}

export type MintLog = {
  coin: number
  key: string
}

export enum ReadingStatsType {
  Today,
  LastWeek,
  LastMonth,
  Total,
}

export type ReadingStats = {
  type: ReadingStatsType
  wc: number
  pc: number
  learned: Set<string>
  reviewed: Set<string>
}

export interface BlockDesc {
  current: number
}

export interface Block {
  version: number
  logs: Log[]
}
