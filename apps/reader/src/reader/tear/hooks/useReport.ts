import { bookAtom } from "@pmate/sdk"
import { readingRecordAtom } from "@/atom/reading/readingRecordAtom"
import { reportPositionAtom } from "@/atom/reading/reportPositionAtom"
import { useBook } from "@pmate/sdk"
import { ReadingParagraph } from "@pmate/meta"
import { useAtomValue, useSetAtom } from "jotai"
import { useCallback, useEffect, useMemo } from "react"

export const useReport = (paragraphs: ReadingParagraph[], pid: number) => {
  const id = useBook()
  const book = useAtomValue(bookAtom(id)).unwrap()
  console.log(`[book]`, book)
  const reportPosition = useSetAtom(reportPositionAtom(id))
  const reportReadingRecord = useSetAtom(readingRecordAtom(id))

  const startTime = useMemo(() => {
    return Date.now()
  }, [pid])

  // Report last paragraph reading finished.
  const report = useCallback(() => {
    if (pid - 1 >= 0) {
      reportReadingRecord(paragraphs[pid], startTime, Date.now())
    }
  }, [pid, paragraphs])

  useEffect(() => {
    const paragraph = paragraphs[pid]
    const timeWait = paragraph.words.length * 0.05 * 1000
    if (!book) {
      return
    }
    reportPosition({
      pid,
      title: book.title,
    })
    setTimeout(() => {
      report()
    }, timeWait)
  }, [pid, paragraphs, book])
}
