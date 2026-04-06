import { useAtom, useAtomValue } from "jotai"
import React from "react"
import { useNavigate } from "react-router"

import { addToMyBooksAtom } from "@pmate/sdk"
import { userAccountModalAtom } from "@/atom/modalAtoms"
import { removeBookAtom } from "@/atom/myBooksAtom"
import { readerStateAtom } from "@/atom/reading/readerStateAtom"
import { profileAtom } from "@pmate/account-sdk"
import { LibraryItem } from "@pmate/meta"
import { BookCardDisplay } from "./BookCardDisplay"
import { BookCardStatsPanel } from "./BookCardStatsPanel"

type BookCardProps = {
  book: LibraryItem
  mode: "read" | "edit"
  onBookTitleChanged?: (title: string) => void
  onChange: () => void
  showStats: boolean
  className?: string
}

export const BookCard = ({
  book,
  mode,
  onBookTitleChanged,
  onChange,
  showStats,
  className,
}: BookCardProps) => {
  const nav = useNavigate()
  const [, addToMyBooks] = useAtom(addToMyBooksAtom)
  const [, removeBook] = useAtom(removeBookAtom)
  const [, showLogin] = useAtom(userAccountModalAtom)
  const profile = useAtomValue(profileAtom)
  const userId = profile?.id ?? ""
  const readerState = useAtomValue(readerStateAtom(book.id))

  const type = book.type

  // Navigate to correct reader or PDF viewer
  const navToBook = async () => {
    if (!userId) {
      // Show login modal if user is not logged in
      showLogin((prev) => ({ ...prev, open: true }))
      return
    }
    switch (type) {
      case "local-pdf":
        nav(`/pdf/${book.id}`)
        break
      case "remote-json":
      case "local-txt":
      case "local-epub": {
        const state = readerState.getState()
        if (state.pid > 0) {
          nav(`/reader/TearMode/${book.id}/${state.pid}`)
        } else {
          nav(`/book/${book.id}`)
        }
        break
      }
    }
  }

  // When we click the main area of the BookCard in `read` mode
  const handleCardClick = () => {
    if (mode === "read") {
      addToMyBooks(book.id)
      navToBook()
    }
  }

  // Called when user clicks the "Remove" icon in `edit` mode
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    removeBook(book.id)
    onChange()
  }

  return (
    <BookCardDisplay
      book={book}
      mode={mode}
      onBookTitleChanged={onBookTitleChanged}
      onRemove={handleRemove}
      onCardClick={handleCardClick}
      showStats={showStats}
      className={className}
      StatsPanel={<BookCardStatsPanel id={book.id} />} // we can pass in the StatsPanel or directly render it
    />
  )
}
