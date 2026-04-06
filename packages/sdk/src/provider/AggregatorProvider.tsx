import { useAtomValue, useSetAtom } from "jotai"
import { Suspense, useEffect } from "react"
import { aggregatorAtom } from "@sdk/atom/aggregatorAtom"
import { balanceAtom } from "@sdk/atom/balanceAtom"
import { booksAtom } from "@sdk/atom/booksAtom"
import { lastPositionUpdateAtom } from "@sdk/atom/lastPositionUpdateAtom"
import { notesBookAtom } from "@sdk/atom/notesBookAtom"
import { paragrapReadUpdateAtom } from "@sdk/atom/paragrapReadUpdateAtom"
import { todayStatsAtom } from "@sdk/atom/todayStatsAtom"
import { totalStatsAtom } from "@sdk/atom/totalStatsAtom"
import { getIndexer } from "@sdk/atom/indexerAtom"
import { profileAtom } from "@pmate/account-sdk"
import { AggregatorEvent, UserLogIndexer } from "@sdk/indexer/UserLogIndexer"
import { IndexerNames } from "@sdk/util/cindexer.def"

export const AggregatorProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  return (
    <Suspense>
      <_AggregatorProvider>{children}</_AggregatorProvider>
    </Suspense>
  )
}

const _AggregatorProvider = ({ children }: { children: React.ReactNode }) => {
  const profile = useAtomValue(profileAtom)
  const userId = profile?.id ?? ""

  useAtomValue(aggregatorAtom(userId))
  const updateBalance = useSetAtom(balanceAtom(userId))
  const updateReadingRecords = useSetAtom(paragrapReadUpdateAtom(userId))
  const updateLastPos = useSetAtom(lastPositionUpdateAtom(userId))
  const updateNotes = useSetAtom(notesBookAtom(userId))
  const updateBooks = useSetAtom(booksAtom(userId))
  const updateTodayStats = useSetAtom(todayStatsAtom(userId))
  const updateTotalStats = useSetAtom(totalStatsAtom(userId))

  useEffect(() => {
    if (!userId) return
    const indexer = getIndexer(IndexerNames.UserLogs, userId) as UserLogIndexer

    void indexer.init()

    const sub1 = indexer.on(AggregatorEvent.BalanceUpdate, () => {
      updateBalance()
    })
    const sub2 = indexer.on(AggregatorEvent.NotesUpdate, () => {
      updateNotes()
    })

    const sub3 = indexer.on(
      AggregatorEvent.ReadingUpdate,
      (body: { book: string }) => {
        updateReadingRecords(body.book)
        updateLastPos(body.book)
      }
    )

    const sub4 = indexer.on(AggregatorEvent.TodayStats, () => {
      updateTodayStats()
    })

    const sub5 = indexer.on(AggregatorEvent.NotesUpdate, () => {
      updateNotes()
    })

    const sub7 = indexer.on(AggregatorEvent.BooksUpdate, () => {
      updateBooks()
    })

    const sub6 = indexer.on(AggregatorEvent.TotalStats, () => {
      updateTotalStats()
    })

    return () => {
      sub1()
      sub2()
      sub3()
      sub4()
      sub5()
      sub6()
      sub7()
    }
  }, [
    updateBalance,
    updateBooks,
    updateLastPos,
    updateNotes,
    updateReadingRecords,
    updateTodayStats,
    updateTotalStats,
    userId,
  ])

  return <>{children}</>
}
