import { useMedia } from "@/hook/useMedia"
import { useThreadMessages } from "@/hook/useThreadMessages"
import { Logger } from "@pmate/utils"
import { useTranslation } from "@pmate/i18n"
import { getLangFull } from "@pmate/lang"
import { Msg, MsgBodyMap, MsgOp, RoomPeerInfo, Voice } from "@pmate/meta"
import {
  AudioPlayers,
  audioPlayerAtom,
  quotedMsgAtom,
  runPrompt,
  useRoomContext,
  useRoomPeers,
  useSendMessage,
} from "@pmate/sdk"
import { useSnackbar } from "@pmate/uikit"
import { useAtomValue } from "jotai"
import { useCallback, useEffect, useState } from "react"
import { AsrMicButton } from "./AsrMicButton"
import { ChatImageInput } from "./ChatImageInput"
import { QuoteCard } from "./QuoteCard"
import { RotationText } from "./RotationText"
import { TranscriptionCard } from "./TranscriptionCard"

const logger = Logger.getDebugger("MessageInput")

const PM_STATIC = (
  process.env.VITE_PUBLIC_PM_STATIC_URL ?? "https://parrot-static.pmate.chat"
).replace(/\/+$/, "")

type TransStage = "recording" | "finished"

async function getChatHistory(
  msgs: Msg<any>[],
  peers: Record<string, RoomPeerInfo>
) {
  const list = msgs
    .filter((x) => x.opcode === MsgOp.TEXT && !x.pending)
    .slice(-10) as Msg<MsgOp.TEXT>[]

  const parts: string[] = []
  for (const msg of list) {
    const peer = peers[msg.from]
    if (!peer) continue
    const body = msg.body as MsgBodyMap[MsgOp.TEXT]
    parts.push(`${peer.nickName}: ${body.text}`)
  }
  return parts.join("\n")
}

export const PractitionerMessageInput = () => {
  const { isDesktop } = useMedia()
  const sendMsg = useSendMessage()
  const {
    threadHash,
    other,
    roomType,
    relationship,
    chatVoice,
    motherLang,
    learningLang,
    role,
    toId,
  } = useRoomContext()
  const [loading, setLoading] = useState(false)
  const { messages } = useThreadMessages()
  const isGroup = roomType === "group"
  const [txt, setTxt] = useState("")
  const { enqueueSnackbar } = useSnackbar()
  const t = useTranslation()
  const player = useAtomValue(audioPlayerAtom(AudioPlayers.ChatPlayer))
  const { peerMap } = useRoomPeers()

  const quoted = useAtomValue(quotedMsgAtom(threadHash))
  const [confirmOpen, setConfirmOpen] = useState(false)

  const [transStage, setTransStage] = useState<TransStage>("recording")

  const aiLoadingSrc = `${PM_STATIC}/luckin-adv.webp`

  const handleSendTextMessage = useCallback(
    async (text: string, chatVoice: Voice) => {
      const t = Date.now()
      const lang = learningLang

      await sendMsg(
        toId,
        MsgOp.TEXT,
        {
          text,
          lang,
          voice: chatVoice.key,
          instructions: chatVoice.instructions || "",
        },
        {
          quote: quoted?.hash,
        }
      )
    },
    [sendMsg, toId, quoted, learningLang]
  )

  const handleSendRevisedMessage = useCallback(
    async (text: string, chatVoice: Voice) => {
      const time = Date.now()
      setLoading(true)
      try {
        const history = await getChatHistory(messages, peerMap)
        logger.log("t2", Date.now() - time, text)

        const revised = await runPrompt("chat/revise", {
          lang: getLangFull(learningLang),
          text,
          history,
        })
        logger.log("t3", Date.now() - time, revised)
        if (!revised) {
          enqueueSnackbar(t("Revision failed"), { variant: "error" })
          return
        }

        player.createTask({
          voice: chatVoice.key,
          text: revised.revised,
          lang: learningLang,
          instructions: chatVoice.instructions,
        })

        await sendMsg(
          toId,
          MsgOp.TEXT,
          {
            text: revised.revised,
            lang: learningLang,
            voice: chatVoice.key,
            instructions: chatVoice.instructions || "",
            raw: text,
          },
          {
            quote: quoted?.hash,
          }
        )
      } finally {
        setLoading(false)
        setTxt("")
      }
    },
    [
      peerMap,
      messages,
      player,
      learningLang,
      sendMsg,
      toId,
      quoted?.hash,
      enqueueSnackbar,
      t,
    ]
  )

  const submitHandlerForText = useCallback(async () => {
    const trimmed = txt.trim()
    if (!trimmed) return

    // if (!isGroup && relationship !== "agreed" && messages.length > 0) {
    //   enqueueSnackbar(t("Awaiting friend confirmation"), { variant: "error" })
    //   return
    // }

    if (learningLang === "en") {
      const match = trimmed.match(/[a-zA-Z]/g)
      const ml = match ? match.length : 0
      if (learningLang === "en" && ml < trimmed.length / 2) {
        enqueueSnackbar(t("Please use English"), { variant: "error" })
        return
      }
    }

    const wordCount = trimmed.split(/\s+/).filter(Boolean).length
    const shortInput = trimmed.length < 10 || wordCount < 2

    if (motherLang === learningLang || shortInput) {
      await handleSendTextMessage(trimmed, chatVoice!)
    } else {
      await handleSendRevisedMessage(trimmed, chatVoice!)
    }
  }, [
    txt,
    learningLang,
    motherLang,
    enqueueSnackbar,
    t,
    handleSendTextMessage,
    chatVoice,
    handleSendRevisedMessage,
  ])

  useEffect(() => {
    const el = document.querySelector<HTMLElement>(
      '[data-uikit="bottom_navbar"]'
    )
    if (!el) return

    const classes = ["relative", "z-[1150]", "bg-black/25"]

    if (confirmOpen) {
      el.classList.add(...classes)
    } else {
      el.classList.remove(...classes)
    }

    return () => {
      el.classList.remove(...classes)
    }
  }, [confirmOpen])

  if (!chatVoice) {
    return
  }

  return (
    <>
      {quoted && (
        <div className="w-100 flex flex-row">
          <QuoteCard quoted={quoted} />
        </div>
      )}
      <div>
        {!loading && (
          <div className="flex items-center gap-3">
            {role === "practitioner" && (
              <div
                className={`w-20 flex-shrink-0 mr-2 flex justify-center items-center relative ${
                  confirmOpen ? "z-[1003]" : ""
                }`}
                onContextMenu={(e) => e.preventDefault()}
              >
                <AsrMicButton
                  disabled={Boolean(loading)}
                  onStart={() => {
                    setTransStage("recording")
                    setConfirmOpen(true)
                  }}
                  onProgress={(text) => setTxt(text)}
                  onAsrResult={({ text }) => {
                    setTxt(text)
                    setTransStage("finished")
                  }}
                  onRelease={() => {
                    setTransStage("finished")
                  }}
                  onAbort={() => {
                    setTxt("")
                    setConfirmOpen(false)
                    setTransStage("recording")
                  }}
                  onError={(error) => {
                    logger.error("ASR error in PractitionerInput:", error)
                    enqueueSnackbar(
                      t("Speech recognition failed. Please try again."),
                      {
                        variant: "error",
                      }
                    )
                    setTxt("")
                    setConfirmOpen(false)
                    setTransStage("recording")
                  }}
                />
              </div>
            )}
            <ChatImageInput />
          </div>
        )}
      </div>

      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[9999]">
          <div className="flex flex-col items-center bg-white rounded-2xl p-4 shadow-xl">
            <div className="w-80 h-50 rounded-xl overflow-hidden flex items-start justify-center">
              <img
                src={aiLoadingSrc}
                alt="AI Loading"
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="relative flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-transparent border-t-violet-500 border-r-violet-500 rounded-full animate-spin"></div>
              <div
                className="absolute w-8 h-8 border-3 border-transparent border-t-pink-400 border-r-pink-400 rounded-full animate-spin"
                style={{
                  animationDirection: "reverse",
                  animationDuration: "0.8s",
                }}
              ></div>
            </div>
            <div className="text-gray-700 text-lg font-medium mt-4">
              {t("analyzing...")}
            </div>
            <RotationText
              texts={[
                t("analyzing grammar structure"),
                t("understanding pronunciation"),
                t("optimizing and restructuring"),
              ]}
              className="text-gray-700 text-base font-medium mt-4"
            />
          </div>
        </div>
      )}

      <TranscriptionCard
        open={confirmOpen}
        text={txt}
        setText={setTxt}
        learningLang={learningLang}
        motherLang={motherLang}
        onCancel={() => {
          setConfirmOpen(false)
          setTxt("")
          setTransStage("recording")
        }}
        onConfirm={async () => {
          if (transStage !== "finished") return
          setConfirmOpen(false)
          await submitHandlerForText()
          setTxt("")
          setTransStage("recording")
        }}
      />
    </>
  )
}
