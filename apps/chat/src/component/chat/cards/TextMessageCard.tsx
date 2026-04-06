import { useMessageReadReporter } from "@/hook/useMessageReadReporter"
import { useThreadMessages } from "@/hook/useThreadMessages"
import { useTranslation } from "@pmate/i18n"
import { Msg, MsgOp } from "@pmate/meta"
import { profileAtom } from "@pmate/account-sdk"
import { peerAtom, useRoomContext } from "@pmate/sdk"
import { useAtomValue } from "jotai"
import { useCallback, useEffect, useRef, useState } from "react"
import { MessageText } from "../MessageText"
import type { VirtualizedState } from "../VirtualizedList"
import { AudioMessageButton } from "./AudioMessageButton"
import { MessageCardDisplay } from "./MessageCardDisplay"
import { MessageDetailCard } from "./MessageDetailCard"

type Props = {
  msg: Msg<MsgOp.TEXT>
  virtualState?: VirtualizedState
}

export const TextMessageCard = ({ msg, virtualState }: Props) => {
  const profile = useAtomValue(profileAtom)
  const userId = profile?.id ?? ""
  const role = profile?.role || "practitioner"

  const { relationship, threadHash } = useRoomContext()
  const { messages } = useThreadMessages()
  const index = messages.findIndex((m) => m.hash === msg.hash)
  const context = messages
    .slice(Math.max(0, index - 5), index)
    .map((m) => (m.body as any).text || "")
    .filter(Boolean)
    .join("\n")
  const peer = useAtomValue(
    peerAtom({
      id: msg.from,
    })
  )
  const isMe = msg.from === userId
  const isFriend = relationship === "agreed"
  const [showDetail, setShowDetail] = useState(false)
  const t = useTranslation()
  const reportMessageRead = useMessageReadReporter()

  const hasAskFriend = msg.body.isAskingFriend && !isMe && !isFriend

  const addForAskFriend = hasAskFriend && (
    <div className="mt-2 text-[14px] tracking-[1px] bg-white px-3 pt-5 pb-15 rounded-xl">
      <div>
        {t(
          "Allow {{name}} to send you messages and share your name and profile picture?",
          { name: peer?.nickName || "" }
        )}
      </div>
      <div className="text-gray-700">
        {t("Before you accept, she won’t know you've seen any messages.")}
      </div>
    </div>
  )

  const handleViewDetail = useCallback(() => {
    setShowDetail(true)
    if (!isMe) {
      reportMessageRead({
        hash: msg.hash,
        threadHash,
      })
    }
  }, [reportMessageRead, msg.hash, isMe, threadHash])

  const handleFirstInViewport = useCallback(() => {
    if (isMe) {
      return
    }
    reportMessageRead({
      hash: msg.hash,
      threadHash,
    })
  }, [isMe, msg.hash, reportMessageRead, threadHash])

  const hasReportedViewportRef = useRef(false)

  const isInViewport = virtualState?.inViewPort()

  useEffect(() => {
    if (role !== "mate") {
      return
    }
    if (!isInViewport) {
      return
    }
    if (hasReportedViewportRef.current) {
      return
    }
    hasReportedViewportRef.current = true
    handleFirstInViewport()
  }, [handleFirstInViewport, role, isInViewport])

  const card = (
    <MessageCardDisplay
      msg={msg}
      contentAlign={hasAskFriend ? "start" : "center"}
      onViewDetail={handleViewDetail}
    >
      {role === "mate" && (
        <>
          <div className="flex flex-col">
            <MessageText
              text={msg.body.text}
              lang={msg.body.lang}
              targetLang="zh-CN"
              via="accurate"
              context={context}
            />
            {addForAskFriend}
          </div>
        </>
      )}
      {role === "practitioner" && (
        <>
          <div className="flex flex-col">
            <AudioMessageButton msg={msg} />
            {addForAskFriend}
          </div>
        </>
      )}
    </MessageCardDisplay>
  )

  return (
    <>
      {card}
      {showDetail && (
        <MessageDetailCard
          msg={msg}
          isMe={isMe}
          onClose={() => setShowDetail(false)}
          context={context}
        />
      )}
    </>
  )
}
