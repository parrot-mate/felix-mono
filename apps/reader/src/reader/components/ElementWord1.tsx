import { tearModeAnalyzeAtom } from "@/atom/reading/tearModeAnalyzeAtom"
import { explainTabsAtom } from "@/reader/atom/explainTabsAtom"
import { SentenceContext } from "@/hook/ParagraphContext"
import { Logger, SelectionHelper } from "@pmate/utils"
import { useAtomValue, useSetAtom } from "jotai"
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { Pressable } from "@/component/Pressable"
import { ReadingContext } from "../tear/context/ReadingContext"
import { WordMarkMeta } from "@pmate/meta"
import { AudioPlayers, audioPlayerAtom } from "@pmate/sdk"

const logger = Logger.getDebugger("ElementWord")

export const ElementWord1 = ({
  children,
  playing,
  className,
  meta,
}: {
  children: string
  className?: string
  playing?: boolean
  meta: WordMarkMeta
}) => {
  const ref = useRef<HTMLSpanElement>(null)
  const [_bgColor] = useState("transparent")
  const setTearMode = useSetAtom(tearModeAnalyzeAtom)
  const setExplain = useSetAtom(explainTabsAtom)
  const readingContext = useContext(ReadingContext)
  const sentence = useContext(SentenceContext)
  const wordPlayer = useAtomValue(audioPlayerAtom(AudioPlayers.WordPlayer))

  const bgColor = useMemo(() => {
    return playing ? "#98dd98" : _bgColor
  }, [_bgColor, playing])

  const parentScrollable = useMemo(() => {
    if (ref.current) {
      const parent = SelectionHelper.findParent(ref.current, (p) => {
        return p.hasAttribute("data-sc-into-view-parent")
      })
      if (parent && parent.scrollHeight > parent.clientHeight) {
        return parent
      }
    }
    return null
  }, [ref.current])

  useEffect(() => {
    if (playing && ref.current && parentScrollable) {
      const elementRect = ref.current.getBoundingClientRect()
      const parentRect = parentScrollable.getBoundingClientRect()
      const isInView =
        elementRect.top >= parentRect.top &&
        elementRect.bottom <= parentRect.bottom
      if (!isInView) {
        ref.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        })
      }
    }
  }, [playing, parentScrollable])

  const handleShortPress = useCallback(() => {
    if (!readingContext) {
      return
    }
    const { paragraph } = readingContext
    const st = sentence?.sentence || ""
    setExplain({
      word: meta,
      sentence: st,
      paragraph,
      show: 'word',
    })
    wordPlayer.createTask(
      {
        text: children.trim(),
      },
      { text: children.trim() }
    )
    // setTearMode("sentence")
  }, [readingContext, sentence, children, setExplain, setTearMode, wordPlayer, meta])

  const handleLongPress = useCallback(() => {
    if (!readingContext) {
      return
    }
    const { paragraph } = readingContext
    const st = sentence?.sentence || ""
    setExplain({
      word: meta,
      sentence: st,
      paragraph,
      show: 'explain',
    })
    // console.log("Long press triggered!")
    // Additional long-press logic here
  }, [readingContext, sentence, children, setExplain, setTearMode, meta])

  const cls = `m-0 p-0 cursor-pointer hover:bg-[#f4edd4] transition-colors duration-300 ${
    className || ""
  }`

  return (
    <Pressable
      className={cls}
      onShortPress={handleShortPress}
      onLongPress={handleLongPress}
      threshold={800}
      ref={ref}
      style={{
        backgroundColor: bgColor,
      }}
    >
      {children}
    </Pressable>
  )
}
