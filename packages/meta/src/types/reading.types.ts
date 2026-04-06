import type { LangShort } from "./lang.types"

export interface BookReadingHistory {
  list: boolean[]
}

export interface Resource {
  type: "image"
  uri: string
  database64?: string
}
export interface Paragraph {
  content: string
  words: string[]
  sentences?: Sentence[]
  resources?: Resource[]
}

export interface Sentence {
  sentence: string
}

export interface Chapter {
  title: string
  paragraphs: Paragraph[]
}

export interface Book {
  name: string
  desc: string
  author: string
  lang: LangShort
  chapters: Chapter[]
}

export interface BookMenu {
  chapters: ChapterMenu[]
}
export interface ChapterMenu {
  index: number
  title: string
  pages: PageMenu[]
}

export interface PageMenu {
  active: boolean
  done: boolean
  index: number
  sectionIndex: number
}

export interface BookStats {
  wordCount: number
  uniqWord: number
  chapterCount: number
  paragraphs: number
}

export interface BookReadingStats {
  finishedVolume: number
}

export interface ReadingBook {
  id: string
  title: string
  author: string
  lang?: LangShort
  intro: string
  paragraphs: ReadingParagraph[]
  punchPages: Page[]
  paragraphsPageMap: Map<number, number>
  wc: number
  uniqWc: number
  chapterCount: number
  sc: number
  version?: number
}

export interface ReadingParagraph {
  index: number
  chapterTitle: string
  content: string
  words: string[]
  sentences: string[]
  resource?: Resource[]
}

export interface PunchPage {
  index?: number
  paragraphs: ReadingParagraph[]
  wc?: number
}

export interface PickUp {
  word: string
  new: boolean
}

export type PunchTimeRecord = {
  [punchKey: string]: {
    last: number // last report timestamp
    acc: number // in seconds
  }
}

// export interface PickUp {
//   bookID: string
//   punchIndex: number
//   type: "new" | "old"
//   word: string
// }

export type PageMode = "punch" | "tear"
export type LeaningDifficulty = "easy" | "middle" | "hard"

export interface BookReadingSetting {
  target: number
  difficulty: LeaningDifficulty
  version: number
}

export interface Page {
  paragraphs: ReadingParagraph[]
  index: number
}

export interface ReaderState {
  mode: PageMode
  pid: number
}
export interface GlobalReaderState {
  id: string
  title?: string
  pid: number
}

type PickedWord = {
  word: string
  isNew: boolean
}

export interface ReadingProgress {
  time: number
  picked: PickedWord[]
}

export type BookReadingSettings = Record<string, BookReadingSetting>

export type AudioTimepoints = {
  timeSeconds: number
  word?: string
  wordIndex: string
}[]

export type ParagraphExplainParams = {
  sentences: string[]
  index: number
  title: string
  hash: string
  lang: LangShort
  userLang: LangShort
  version: number
}

export interface WordMarkMeta {
  word: string
  startPosition: number
  inVocabulary: boolean
  readable: boolean
  markId: string
}
