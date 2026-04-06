import React from "react"
import { CircularProgress } from "@mui/material"
import { useAtomValue } from "jotai"
import { bookAtom } from "@pmate/sdk"
import { profileAtom } from "@pmate/account-sdk"
import { bookStatsAtom } from "@pmate/sdk"

type StatsPanelPureProps = {
  id: string
}

export const BookCardStatsPanel = ({ id }: StatsPanelPureProps) => {
  // If not enough progress, show nothing
  const profile = useAtomValue(profileAtom)
  const userId = profile?.id ?? ""
  const book = useAtomValue(bookAtom(id)).unwrapOr(null)
  if (!book) {
    return null
  }
  const stats = useAtomValue(
    bookStatsAtom({
      user: userId,
      bookId: book.id,
    })
  )
  const percent = stats.finishedVolume / book.wc

  if (percent < 1) {
    return null
  }

  return (
    <div
      className="absolute z-[1] top-[5px] left-[5px] flex items-center justify-center opacity-70"
    >
      <CircularProgress
        className="text-[#78f978] w-10 h-6"
        variant="determinate"
        value={percent}
      />
      <div
        className="absolute inset-0 flex items-center justify-center text-white text-[8px] font-bold"
      >
        <label>{percent.toFixed(1)}%</label>
      </div>
    </div>
  )
}
