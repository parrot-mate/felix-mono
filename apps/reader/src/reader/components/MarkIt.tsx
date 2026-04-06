import { Fallback } from "@/component/Fallback"
import { isMobile } from "@/util/envCheck"
import { Logger } from "@pmate/utils"
import { useAtomValue } from "jotai"
import { Suspense, useEffect, useState } from "react"

import { useWordList } from "@/reader/hook/useWordList"
import {
  AudioEvents,
  AudioEventsParams,
  AudioPlayerEvents,
  AudioPlayers,
} from "@pmate/sdk"
import { WordMarkMeta } from "@pmate/meta"
import { userSettingsAtom } from "@pmate/account-sdk"
import { audioPlayerAtom } from "@pmate/sdk"
import { ElementWord1 } from "./ElementWord1"
interface MarkItProps {
  children: string
  className?: string
  style?: React.CSSProperties
  textHash?: string
}

const logger = Logger.getDebugger("MarkIt")

export const MarkIt = (props: MarkItProps) => {
  const { children } = props
  const lang = useAtomValue(userSettingsAtom("uiLang"))
  const wordList = useWordList([children], lang)

  return (
    <MarkItWordList
      wordList={wordList}
      style={props.style}
      textHash={props.textHash}
    />
  )
}

interface MarkItWordListProps {
  wordList: WordMarkMeta[]
  style?: React.CSSProperties
  textHash?: string
}

export const MarkItWordList = (props: MarkItWordListProps) => {
  const { wordList, textHash } = props

  const cls = `select-none ${!isMobile() ? "cursor-pointer" : ""}`

  logger.log("MarkItWordList", wordList)
  return (
    <Suspense fallback={<Fallback name={"markit"} />}>
      <span
        className={cls}
        style={props.style}
        onContextMenu={(e) => {
          e.stopPropagation()
          e.preventDefault()
        }}
      >
        {wordList.map((item, i) => {
          return <MarkWord key={i} item={item} textHash={textHash} />
        })}
      </span>
    </Suspense>
  )
}

const MarkWord = (props: { item: WordMarkMeta; textHash?: string }) => {
  const { item, textHash } = props

  const [playing, setPlaying] = useState(false)
  const cls = item.inVocabulary ? "text-[#00b894]" : ""
  const bookPlayer = useAtomValue(audioPlayerAtom(AudioPlayers.BookPlayer))

  useEffect(() => {
    if (!textHash) {
      return
    }

    const sub = bookPlayer.on<AudioEventsParams<AudioEvents.Progress>>(
      AudioPlayerEvents.WordIndexUpdate,
      (body) => {
        const { task, wordIndex } = body
        if (typeof wordIndex !== "string") {
          return
        }

        const match =
          wordIndex?.toLowerCase() === item.markId && task.textHash === textHash
        setPlaying(match)
      }
    )
    return sub
  }, [textHash, bookPlayer])

  return (
    <ElementWord1 playing={playing} className={cls} meta={item}>
      {item.word}
    </ElementWord1>
  )
}
