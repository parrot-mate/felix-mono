import { ReadingParagraph, Sentence } from "@pmate/meta"
import { createContext } from "react"

export const ParagraphContext = createContext<{
  paragraph: ReadingParagraph | null
  pid: number | undefined
}>({
  paragraph: null,
  pid: undefined,
})
export const SentenceContext = createContext<
  | (Sentence & {
      id: string
    })
  | null
>(null)
