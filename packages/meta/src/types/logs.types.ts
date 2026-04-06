import type { TS_Log } from "./blockchain.types"
import type { PickUp } from "./reading.types"
import type { VolcabularyAction } from "./types"

export const UserLogs = {
  // Punch: "punch-v1",
  PunchV2: "punch-v2",
  Vol: "volcabulary",
  WordNotExisted: "word-not-existed",
  BookReadingLog: (id: string) => `book-reading-${id}`,
  BookReadingLogV2: (id: string) => `book-reading-${id}-v2_2`,
  Achivements: "achivements",
  NotesLogs: "notes",
}

export interface PendingLog<T> {
  id?: string
  file: string
  user: string
  data: T
}

export interface VolcabularyLog {
  t: number
  w: string
  a: VolcabularyAction
  extras?: {
    bk: string // related book id
    pid: number // related paragraph
  }
}

export type VolcabularyLogV2 = TS_Log<{
  w: string
  a: VolcabularyAction
  extras?: {
    bk: string // related book id
    pid: number // related paragraph
  }
}>

export interface IUserLog {
  t: number
}

export interface BookReadingLog {
  t: number
  pid: number
}

export interface BookReadingLogV2 {
  t: number
  pid: number
  wc: number
  s?: number // start
  e?: number // end
  picked?: PickUp[]
}

export interface UserNotesLogsV1 {
  id: string
  title: string
  content: string
  op: number // 0-add 1-delete
  t: number
}

export interface PunchLogV2 extends IUserLog {
  bk: string // book id
  ver: number // Settings Version
  idx: number
}

/* Blocks */
