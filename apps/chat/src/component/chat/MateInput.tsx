import { useMedia } from "@/hook/useMedia"
import { useThreadMessages } from "@/hook/useThreadMessages"
import { Logger } from "@pmate/utils"
import { useTranslation } from "@pmate/i18n"
import { MsgOp, Voice } from "@pmate/meta"
import { quotedMsgAtom, useRoomContext, useSendMessage } from "@pmate/sdk"
import { IconButton, IconSend, InputField, useSnackbar } from "@pmate/uikit"
import { useAtomValue } from "jotai"
import { useCallback, useRef, useState } from "react"
import { LoadingSphere } from "./AILoading"
import { ChatImageInput } from "./ChatImageInput"
import { QuoteCard } from "./QuoteCard"

const logger = Logger.getDebugger("MessageInput")

export const MateInput = () => {
  const { isDesktop } = useMedia()
  const sendMsg = useSendMessage()
  const {
    threadHash,
    other,
    roomType,
    relationship,
    chatVoice,
    motherLang,
    toId,
  } = useRoomContext()
  const peerId = other?.id || ""
  const [loading] = useState(false)
  const { messages } = useThreadMessages()
  const [txt, setTxt] = useState("")
  const { enqueueSnackbar } = useSnackbar()
  const t = useTranslation()

  const quoted = useAtomValue(quotedMsgAtom(threadHash))
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null)
  const [_, setShowEmoji] = useState(false)
  const askingFriend = Boolean(
    peerId && relationship !== "agreed" && messages.length === 0
  )
  const [confirmOpen] = useState(false)

  const handleSendTextMessage = async (text: string, chatVoice: Voice) => {
    await sendMsg(
      toId,
      MsgOp.TEXT,
      {
        text,
        lang: "zh-CN",
        voice: chatVoice.key,
        instructions: chatVoice.instructions || "",
        isAskingFriend: askingFriend,
      },
      {
        quote: quoted?.hash,
      }
    )
  }

  const submitHandlerForText = useCallback(async () => {
    const trimmed = txt.trim()
    if (!trimmed) return

    // if (!isGroup && relationship !== "agreed" && messages.length > 0) {
    //   enqueueSnackbar(t("Awaiting friend confirmation"), { variant: "error" })
    //   return
    // }

    await handleSendTextMessage(trimmed, chatVoice!)
  }, [messages, txt, chatVoice, relationship, peerId, enqueueSnackbar, t, toId])

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
        {loading && <LoadingSphere />}
        {!loading && (
          <>
            <div
              className="flex-1 mx-2 select-none"
              onContextMenu={(e) => e.preventDefault()}
            >
              {!confirmOpen && (
                <>
                  <InputField
                    ref={inputRef}
                    multiline
                    className="w-full"
                    value={txt}
                    onChange={(e) => {
                      setTxt(e.target.value)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        e.stopPropagation()
                        submitHandlerForText()
                        setTxt("")
                      }
                    }}
                  />
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <ChatImageInput />
              <IconButton
                className="relative z-[1001]"
                onClick={() => {
                  if (!txt.trim()) return
                  submitHandlerForText()
                  setShowEmoji(false)
                  setTxt("")
                }}
              >
                <IconSend className="w-6 h-6" />
              </IconButton>
            </div>
          </>
        )}
      </div>
    </>
  )
}
