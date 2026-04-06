import { ReadingBook, ReadingParagraph } from "@pmate/meta"
import React from "react"

interface ReadingContext {
  paragraph: ReadingParagraph
  book: ReadingBook
}

export const ReadingContext = React.createContext<ReadingContext | null>(null)
