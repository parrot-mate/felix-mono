import { ReadingBook, ReadingParagraph } from "@pmate/meta"
import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { SlideType } from "../types"

type SlideDataMap = {
  [SlideType.Paragraph]: ReadingParagraph
}
interface TearModeSlide<TType extends SlideType> {
  type: TType
  data: SlideDataMap[TType]
  id: number
}

interface SlideState {
  index: number
  pid: number
  slides: TearModeSlide<SlideType>[]
  uid: number
}

const CHUNK = 1000
const OFFSET = 5

export const useSliders = (
  paragraphs: ReadingParagraph[],
  book: ReadingBook
) => {
  const params = useParams()
  const nav = useNavigate()

  const getSwiperState = useCallback((pid: number) => {
    const chunkIndx = Math.floor(pid / CHUNK)
    const leftStart = chunkIndx * CHUNK
    const offsetLeft = leftStart > OFFSET ? OFFSET : 0

    const index = (pid % CHUNK) + offsetLeft
    // Additional 10 paragraphs for smooth sliding
    const range = [
      leftStart - offsetLeft,
      Math.min((chunkIndx + 1) * CHUNK + OFFSET, book.paragraphs.length),
    ]

    return {
      uid: chunkIndx,
      index,
      pid,
      slides: paragraphs.slice(range[0], range[1]).map((p) => ({
        type: SlideType.Paragraph,
        data: p,
        id: p.index,
      })),
    }
  }, [])
  const [state, setState] = useState<SlideState>(() => {
    const pid = parseInt(params.pid || "0")
    return getSwiperState(pid)
  })

  const slideTo = useCallback(
    (index: number) => {
      const { pid, index: prevIndex } = state
      if (index === prevIndex) return
      const diff = index - prevIndex
      const newPid = pid + diff
      const newState = getSwiperState(newPid)
      setState(newState)
    },
    [state]
  )

  useEffect(() => {
    nav(`/reader/TearMode/${book.id}/${state.pid}`, { replace: true })
  }, [state.pid])

  return {
    ...state,
    slideTo,
  }
}
