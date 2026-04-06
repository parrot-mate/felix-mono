import { SentenceContext } from "@/hook/ParagraphContext"
import { ReadingParagraph } from "@pmate/meta"
import { memo, Suspense, useEffect, useMemo, useState } from "react"

import { enableSwipeAtom } from "@/atom/ui/enableSwipeAtom"
import { useSha1 } from "@/hook/useSha1"
import { explainTabsAtom } from "@/reader/atom/explainTabsAtom"
import { MarkIt, MarkItWordList } from "@/reader/components/MarkIt"
import { useWordList } from "@/reader/hook/useWordList"
import { ContentCopy, PlayArrow } from "@mui/icons-material"
import { FlexRow } from "@pchip/components"
import { Logger } from "@pmate/utils"
import { getLangReadingSetting } from "@pmate/lang"
import {
  audioPlayerAtom,
  AudioPlayers,
  AudioPlayState,
  bookAtom,
  useBook,
  usePlayAudio,
  userFontSizeAtom,
} from "@pmate/sdk"
import { IconButton, useSnackbar } from "@pmate/uikit"
import { useAtom, useAtomValue } from "jotai"
import { ReadingContext } from "./context/ReadingContext"
import { ExplainTabs } from "./ExplainTabs"
import { ParagraphQuestion } from "./ParagraphQuestion"
import { TearModeImage } from "./TearModeImage"
import { Thumb } from "./Thumb"

const logger = Logger.getDebugger("TearModeParagraphRender")

export const TearModeParagraphRender = memo(
  ({
    paragraph,
    onEnter,
    onLeave,
    active,
  }: {
    paragraph: ReadingParagraph
    onEnter: () => void
    onLeave: () => void
    active: boolean
  }) => {
    const { enqueueSnackbar } = useSnackbar()
    const id = useBook()
    const book = useAtomValue(bookAtom(id)).unwrap()
    const index = paragraph.index
    // const pageId = book.paragraphsPageMap.get(index)!
    const fontSize = useAtomValue(userFontSizeAtom)
    const [opacity, setOpacity] = useState(0)
    // const readingPercent = useAtomValue(
    //   readingPercentAtom({
    //     pid: index,
    //     id,
    //     pageNo: pageId,
    //   })
    // )

    useEffect(() => {
      if (active) {
        setTimeout(() => {
          setOpacity(1)
        }, 500)
      } else {
        setOpacity(0)
      }
      return () => {
        setEnableSwipe(true)
      }
    }, [active])
    useEffect(() => {
      onEnter()
      return () => {
        onLeave()
      }
    }, [])

    const textHash = useSha1(paragraph.content)
    const wordList = useWordList(paragraph.sentences, book.lang || "en")
    const [enableSwipe, setEnableSwipe] = useAtom(enableSwipeAtom)
    const explainData = useAtomValue(explainTabsAtom)
    const word = explainData?.word
    // Updated to use audioPlayerAtom:
    const bookPlayer = useAtomValue(audioPlayerAtom(AudioPlayers.BookPlayer))
    const { play, playState } = usePlayAudio(bookPlayer)

    const explainingSentence = explainData?.sentence || null

    const audioTask = useMemo(() => {
      return paragraph.content
    }, [paragraph])

    let c = 0
    const hasResource = Boolean(paragraph.resource?.length)
    logger.log("current paragraph", paragraph)
    return (
      <ReadingContext.Provider
        value={{
          paragraph,
          book: book,
        }}
      >
        <TearModeImage
          key={paragraph.index}
          paragraph={paragraph}
          book={book}
        />

        <div className="z-[1] h-full flex flex-col">
          <div
            className="flex-[6] flex flex-col justify-center overflow-hidden transition-opacity ease-in duration-500 relative"
            data-paragraph={paragraph.index}
            id={`text-scroller-${paragraph.index}`}
            style={{ opacity }}
          >
            <div
              className="p-[5px] my-[20px] mx-[10px] overflow-y-auto bg-[rgba(255,255,255,0.85)]"
              data-content-area
              id={`paragraph-index-${paragraph.index}`}
              data-sc-into-view-parent
              style={{
                fontSize: `${fontSize}px`,
                overflow: "scroll",
                maxHeight: "65%",
              }}
              onTouchMove={(e) => {
                if (
                  e.currentTarget.scrollHeight !== e.currentTarget.clientHeight
                ) {
                  if (enableSwipe) {
                    setEnableSwipe(false)
                  }
                  e.stopPropagation()
                }
                if (!enableSwipe) {
                  setEnableSwipe(true)
                }
              }}
              onTouchEnd={() => {
                if (!enableSwipe) {
                  setEnableSwipe(true)
                }
              }}
              onTouchCancel={() => {
                if (!enableSwipe) {
                  setEnableSwipe(true)
                }
              }}
            >
              <div>
                {paragraph.chapterTitle && (
                  <h2
                    style={{
                      marginTop: "2rem",
                    }}
                  >
                    <MarkIt>{paragraph.chapterTitle}</MarkIt>
                  </h2>
                )}
                {hasResource && (
                  <FlexRow justifyContent={"flex-start"}>
                    {paragraph.resource?.map((r, i) => {
                      return (
                        <div key={i} className="h-[40px]">
                          <Thumb
                            src={`data:image/jpeg;base64,${r.database64}`}
                            key={i}
                          />
                        </div>
                      )
                    })}
                  </FlexRow>
                )}
                {paragraph.sentences.map((sentence, i) => {
                  const setting = getLangReadingSetting(book.lang || "en")
                  const prts = setting.wordSpliter(sentence)

                  c += prts.length
                  const currentExplainning =
                    explainingSentence &&
                    explainingSentence.toLowerCase().trim() ===
                      sentence.toLowerCase().trim()
                  return (
                    <SentenceContext.Provider
                      value={{
                        sentence,
                        id: `${paragraph.index}-${i}`,
                      }}
                      key={sentence}
                    >
                      <div
                        className="inline text-black font-medium"
                        style={{
                          lineHeight: `${fontSize * 2.4}px`,
                          background: currentExplainning
                            ? "rgba(0,0,0,.1)"
                            : "",
                        }}
                      >
                        <Suspense>
                          <MarkItWordList
                            wordList={wordList.slice(c - prts.length, c)}
                            textHash={textHash}
                          ></MarkItWordList>
                        </Suspense>
                      </div>
                    </SentenceContext.Provider>
                  )
                })}
              </div>
            </div>
            <IconButton
              className="absolute bottom-[10px] right-[10px] z-[100] bg-[rgba(255,255,255,0.5)] hover:bg-[rgba(255,255,255,0.7)]"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                navigator.clipboard.writeText(paragraph.content)
                enqueueSnackbar("Copied to clipboard", { variant: "success" })
              }}
            >
              <ContentCopy fontSize="small" />
            </IconButton>
            <ParagraphQuestion book={book} paragraphIndex={index} />
            {Boolean(
              playState === AudioPlayState.Paused ||
                playState === AudioPlayState.Stopped
            ) && (
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] flex justify-center items-center bg-[rgba(255,255,255,0.5)] rounded-full w-[50px] h-[50px] transition-opacity duration-500 ease-in-out opacity-100"
                data-content-area
              >
                <IconButton
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    play({
                      text: audioTask,
                      timePoints: true,
                    })
                  }}
                >
                  <PlayArrow />
                </IconButton>
              </div>
            )}
          </div>

          <div
            className="flex-[3] overflow-hidden bg-[rgba(255,255,255,0.85)] z-[2] flex flex-col rounded-tr-[60px] rounded-tl-[20px] mr-[20px] transition-transform ease-in duration-300"
            data-content-area
            style={{
              transform: `translateX(${opacity === 1 && word ? 0 : "-100%"})`,
            }}
          >
            <div
              className="overflow-y-auto border-t border-[#ccc] relative"
              onTouchMove={(e) => {
                if (
                  e.currentTarget.scrollHeight !== e.currentTarget.clientHeight
                ) {
                  if (enableSwipe) {
                    setEnableSwipe(false)
                  }
                  e.stopPropagation()
                }
                if (!enableSwipe) {
                  setEnableSwipe(true)
                }
              }}
            >
              <ExplainTabs />
            </div>
          </div>
        </div>
      </ReadingContext.Provider>
    )
  }
)
