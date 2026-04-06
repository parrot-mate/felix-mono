import { ReadingBook, SentenceBreakDown } from "@pmate/meta"
import { Maybe } from "@pmate/utils"
import { atom } from "jotai"
import { atomFamily } from "jotai/utils"

interface SupportTooltip {
  anchor: HTMLElement | null
  markId?: Number
  word: string
  book: Maybe<ReadingBook>
  sentence: string
  paragraph: string
  sentenceID: string
  pid?: number
}
export const supportTooltipAtom = atom<SupportTooltip>({
  anchor: null,
  word: "",
  book: Maybe.Nothing(),
  sentence: "",
  paragraph: "",
  sentenceID: "",
})
