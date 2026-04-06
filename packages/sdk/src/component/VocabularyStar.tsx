import type { VolcabularyLogV3 } from "@pmate/meta"
import { LogType, VolcabularyAction } from "@pmate/meta"
import { IconButton, IconStar, IconStarOutline } from "@pmate/uikit"
import { useAtomValue, useSetAtom } from "jotai"
import { useCallback, useMemo } from "react"
import { appendUserLogAtom } from "@sdk/atom/appendUserLogAtom"
import { bookAtom } from "@sdk/atom/bookAtom"
import { profileAtom } from "@pmate/account-sdk"
import { useVolMarked } from "@sdk/hooks/useVolMarked"
import { createUserLog } from "@sdk/indexer/UserLogIndexer"
import { useBook } from "@sdk/provider/BookLoader"

type VocabularyLogBook = {
  id: string
  title: string
}

export interface VocabularyStarProps {
  word: string
  sentence?: string
  className?: string
}

export const VocabularyStar = ({
  word,
  sentence = "",
  className,
}: VocabularyStarProps) => {
  const bookId = useBook()
  const readingBook = useAtomValue(bookAtom(bookId))
  const vocabularyBook = useMemo<VocabularyLogBook>(() => {
    return readingBook
      .map((book) => ({ id: book.id, title: book.title }))
      .unwrapOr({ id: bookId, title: "" })
  }, [bookId, readingBook])

  const appendLog = useSetAtom(appendUserLogAtom)
  const marked = useVolMarked(word)
  const profile = useAtomValue(profileAtom)
  const userId = profile?.id ?? ""

  const handleToggle = useCallback(async () => {
    const action = marked ? VolcabularyAction.Cancel : VolcabularyAction.Add
    let metadata: VolcabularyLogV3 = {
      word,
      action,
      book: vocabularyBook,
      sentence,
    }

    const log = await createUserLog(LogType.Vocabulary, metadata, userId)
    await appendLog(log)
  }, [appendLog, vocabularyBook, marked, sentence, userId, word])

  return (
    <IconButton
      className={className}
      onClick={handleToggle}
      aria-label={marked ? "Remove from vocabulary" : "Add to vocabulary"}
    >
      {marked ? (
        <IconStar className="h-4 w-4 fill-violet-400" />
      ) : (
        <IconStarOutline className="h-4 w-4 fill-violet-100 transition-colors hover:text-primary-400" />
      )}
    </IconButton>
  )
}
