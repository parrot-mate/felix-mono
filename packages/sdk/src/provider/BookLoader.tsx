import { Logger } from "@pmate/utils"
import type { ReadingBook } from "@pmate/meta"
import { useAtomValue } from "jotai"
import React, { useContext } from "react"
import { useParams } from "react-router-dom"
import { bookAtom } from "@sdk/atom/bookAtom"

const BookContext = React.createContext<string>("")

const logger = Logger.getDebugger("BookLoader")

export const BookLoader = ({
  children,
}: {
  children: (book: ReadingBook) => React.ReactNode
}) => {
  const { id } = useParams() as {
    id: string
  }
  const _book = useAtomValue(bookAtom(id))
  if (_book.isNothing()) {
    return null
  }

  const book = _book.unwrap()

  if (!book) {
    logger.error("Book not found:", id)
    return null
  }
  return (
    <BookContext.Provider value={book.id}>
      {children(book)}
    </BookContext.Provider>
  )
}

export const useBook = () => {
  const id = useContext(BookContext)
  if (!id) {
    throw new Error("useBook must be used within a BookLoader")
  }
  return id
}