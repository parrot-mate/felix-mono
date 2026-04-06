export type SimpleMeaning = [string, string] // [pos, meaning]

export interface SimpleWord {
  w: string
  l: SimpleMeaning[]
  images?: string[]
  see?: string
}

export type Dict = Record<string, SimpleWord>
