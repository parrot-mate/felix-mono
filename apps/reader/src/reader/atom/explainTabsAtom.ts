import { atom } from 'jotai'
import { ReadingParagraph, WordMarkMeta } from '@pmate/meta'

export interface WordExplainTabs {
  word: WordMarkMeta
  sentence: string
  paragraph: ReadingParagraph
  show: 'word' | 'explain'
}

export const explainTabsAtom = atom<WordExplainTabs | null>(null)
