import type { Book } from "./reading.types"

export enum VolcabularyAction {
  Add = 1,
  Cancel = 2,
  Review = 3,
}

export interface ServerResponse<T> {
  message: string
  success: boolean
  data: T
}
export type SupportedTasks =
  | "/task/tts"
  | "/task/tts-read"
  | "/task/paragraph-image"
  | "/task/sentence-analyze"
  | "/task/generate-simple-word"
  | "/taskplus/generate-image"
  | "/task/generate-prompt"

export interface LibraryRef {
  ref: LibraryItem
}

export interface LibraryItem {
  id: string
  type:
    | "local-pdf"
    | "remote-pdf"
    | "remote-json"
    | "remote-txt"
    | "local-txt"
    | "local-epub"
  link?: string
  author: string
  intro: string
  title?: {
    en: string
    cn: string
  }
  cover?: string
  data?: Blob | string | Book
}

export interface User {
  name: string
}

export type ResourceTypes =
  | "book-analyze"
  | "word-simple"
  | "image"
  | "cover"
  | "tts"

export type Voice = {
  name: string
  provider: "openai" | "kokoro"
  gender: "F" | "M"
  instructions?: string
  key: string
}

export type Updator<T> = (val: T) => T

export type Cached<T> = {
  data: T
  expire: number
}

export interface TaskInit {
  id: string
  user: string
  body: any
  type: "asr" | "tts"
}

export interface Task extends TaskInit {
  time: number
  leaseId: string
}

export interface TaskResult {
  id: string
  status: "pending" | "success" | "error" | "in-progress"
  user: string
  data: any
  files?: {
    base64?: string
    type?: string
    url?: string
  }[]
  message?: string
  leaseId: string
}
