import { getUserLang } from "@/resource/getUserLang"
import { AudioPlayers, audioPlayerAtom } from "@pmate/sdk"
import { AudioTaskInit, ReadingBook, ReadingParagraph } from "@pmate/meta"
import { prefetchParagraphImage, preloadBookSentenceExplain } from "@pmate/sdk"
import { useAtomValue } from "jotai"
import { debounce } from "lodash"
import { useCallback, useEffect, useMemo } from "react"

export function usePreload(
  book: ReadingBook,
  paragraphs: ReadingParagraph[],
  index: number
) {
  const bookPlayer = useAtomValue(audioPlayerAtom(AudioPlayers.BookPlayer))

  const audioTasks = useMemo(() => {
    const prepareParagraphs = paragraphs.slice(index, index + 5)
    const tasks = prepareParagraphs.map((p) => {
      return p.content
    })
    return tasks
  }, [index, paragraphs])

  const prepareSound = useMemo(
    () =>
      debounce((tasks: string[]) => {
        bookPlayer.createTask(
          ...tasks.map((x) => {
            return {
              text: x,
              timePoints: true,
            } as AudioTaskInit
          })
        )
      }, 100),
    [bookPlayer]
  )

  const preloadExplains = useCallback(async () => {
    const pid = index
    const list = paragraphs.slice(pid, pid + 3)
    for (const paragraph of list) {
      const userLang = await getUserLang()
      preloadBookSentenceExplain(book, paragraph, userLang)
    }
  }, [index, paragraphs, book])

  useEffect(() => {
    preloadExplains()
  }, [index, preloadExplains])

  useEffect(() => {
    prepareSound(audioTasks)
  }, [audioTasks, prepareSound])

  useEffect(() => {
    prefetchParagraphImage(book, index)
  }, [index, book])

  return { audioTasks }
}
