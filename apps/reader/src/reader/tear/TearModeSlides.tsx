import { useAtom, useAtomValue, useSetAtom } from "jotai"

import { Logger, SelectionHelper } from "@pmate/utils"
import { memo, Suspense, useCallback, useEffect } from "react"

import "swiper/css"
import "swiper/css/virtual"
import { Swiper, SwiperSlide } from "swiper/react"

import { Characters } from "@/atom/companion/characters"
import { enableSwipeAtom } from "@/atom/ui/enableSwipeAtom"
import { explainTabsAtom } from "@/reader/atom/explainTabsAtom"
import { Box } from "@mui/material"
import { ReadingParagraph } from "@pmate/meta"
import { userSettingsAtom } from "@pmate/account-sdk"
import {
  audioPlayerAtom,
  AudioPlayers,
  bookAtom,
  usePlayAudio,
  userSettingsVersion,
} from "@pmate/sdk"
import { Virtual } from "swiper/modules"
import { makeStyles } from "tss-react/mui"
import { currentSlideType } from "./atoms/currenySlideType"
import { showDownloadTaskModal } from "./atoms/downloadTasksAtom"
import { CompanionAvatar } from "./CompanionAvatar"
import { DownloadOffline } from "./DownloadOffline"
import { usePreload } from "./hooks/usePreloads"
import { useReport } from "./hooks/useReport"
import { useSliders } from "./hooks/useSliders"
import { Paging } from "./Paging"
import { TearModeHome } from "./TearModeHome"
import { TearModeParagraphRender } from "./TearModeParagraphRender"
import { TopMenu } from "./TopMenu"

const logger = Logger.getDebugger("TearModeSlides")

export const TearModeSlides = memo(({ id }: { id: string }) => {
  const book = useAtomValue(bookAtom(id)).unwrap()
  const { classes } = useStyles()
  const paragraphs = book.paragraphs
  const [enable, setEnable] = useAtom(enableSwipeAtom)
  const autoplay = useAtomValue(userSettingsAtom("autoread"))
  const uver = useAtomValue(userSettingsVersion)

  const setExplain = useSetAtom(explainTabsAtom)
  const companionName = useAtomValue(userSettingsAtom("companion"))
  const companion = Characters.find((c) => c.name === companionName)

  const closeExplain = useCallback(() => {
    setExplain(null)
  }, [])

  useEffect(() => {
    setEnable(true)
  }, [])

  // Replaced AudioPlayer.bookQueue with the new audioPlayerAtom approach
  const bookPlayer = useAtomValue(audioPlayerAtom(AudioPlayers.BookPlayer))
  const { play } = usePlayAudio(bookPlayer)
  const showDownload = useAtomValue(showDownloadTaskModal)

  const { index, pid, slides, slideTo, uid } = useSliders(paragraphs, book)

  useReport(paragraphs, pid)
  const { audioTasks } = usePreload(book, paragraphs, pid)

  const playSound = useCallback(async () => {
    play({ text: audioTasks[0], timePoints: true })
  }, [audioTasks])

  useEffect(() => {
    if (autoplay) {
      playSound()
    }
  }, [audioTasks, autoplay])

  const setSlideType = useSetAtom(currentSlideType)
  if (slides.length === 0) {
    return null
  }
  logger.log({
    range: [slides[0].id, slides[slides.length - 1].id].join("-"),
    index,
    pid,
  })
  return (
    <Box className={classes.root} key={`${uver}-${uid}-${companionName}`}>
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Swiper
          modules={[Virtual]}
          initialSlide={index}
          slidesPerView={1}
          direction="vertical"
          onClick={(_, e) => {
            if (
              SelectionHelper.findParent(e.target as HTMLElement, (e) => {
                return e.hasAttribute("data-content-area")
              })
            ) {
              return
            }
            closeExplain()
          }}
          speed={500}
          enabled={enable}
          virtual={{
            addSlidesBefore: 1,
            addSlidesAfter: 1,
          }}
          pagination
          style={{
            flex: 7,
            width: "100%",
            height: "100%",
          }}
          onSlideChange={(swiper: any) => {
            if (isNaN(swiper.activeIndex)) {
              return
            }
            logger.log("onSlideChange", swiper.activeIndex)
            const index = swiper.activeIndex
            const slide = slides[index]

            setSlideType(slide.type)
            closeExplain()
            slideTo(index)
            // nav(`/reader/TearMode/${id}/${pid}`, { replace: true })
          }}
          passiveListeners={false}
        >
          {slides.map((s, i) => {
            return (
              <SwiperSlide key={s.id} virtualIndex={s.id}>
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    background: "white",
                  }}
                  onTouchMove={(e) => {
                    const y = e.touches[0].pageY
                    const h = window.innerHeight
                    // logger.log("enabled", enable, y, h)

                    if (h - y < 30) {
                      setEnable(false)
                      e.stopPropagation()
                      e.preventDefault()
                    }
                  }}
                  onTouchEnd={() => {
                    setEnable(true)
                  }}
                  onTouchCancel={() => {
                    setEnable(true)
                  }}
                >
                  <Suspense>
                    <TearModeParagraphRender
                      onEnter={() => {}}
                      onLeave={() => {}}
                      paragraph={s.data as ReadingParagraph}
                      active={i === index}
                    />
                  </Suspense>
                </div>
              </SwiperSlide>
            )
          })}
        </Swiper>
        <Paging pid={pid} />
      </Box>
      <TopMenu />
      <Suspense>
        <TearModeHome />
      </Suspense>
      {companion && (
        <CompanionAvatar
          initialPosition={{
            bottom: 30,
            right: 30,
          }}
          videoSrc={companion.video}
        />
      )}
      {showDownload && (
        <Suspense fallback={null}>
          <DownloadOffline bookId={book.id} pid={pid} />
        </Suspense>
      )}
    </Box>
  )
})

const useStyles = makeStyles()(() => {
  return {
    root: {
      display: "flex",
      flexDirection: "column",
      height: "100vh",
    },
    indicator: {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: 100,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "rgba(255,255,255,0.5)",
      borderRadius: "50%",
      width: "50px",
      height: "50px",
      transition: "opacity 0.5s ease-in-out",
    },
  }
})
