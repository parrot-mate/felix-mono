import { Pressable } from "@/component/Pressable"
import { Logger } from "@pmate/utils"
import { profileAtom } from "@pmate/account-sdk"
import { useTranslation } from "@pmate/i18n"
import { Msg, MsgOp } from "@pmate/meta"
import {
  peerAtom,
  quotedMsgAtom,
  useRoomContext,
  useSendMessage,
} from "@pmate/sdk"
import { useAtomValue, useSetAtom } from "jotai"
import { ReactNode, useRef, useState } from "react"
import { Hover } from "../Hover"
import { PeerAvatar } from "../PeerAvatar"

const logger = Logger.getDebugger("MessageCardDisplay")
export const MessageCardDisplay = ({
  msg,
  children,
  onClick,
  onViewDetail,
  contentAlign = "center",
}: {
  msg: Msg<MsgOp>
  onClick?: () => void
  onViewDetail?: () => void
  children: ReactNode
  contentAlign?: "center" | "start"
}) => {
  const t = useTranslation()
  const { threadHash } = useRoomContext()
  const profile = useAtomValue(profileAtom)
  const userId = profile?.id ?? ""
  const ref = useRef<HTMLDivElement>(null)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const sendMsg = useSendMessage()
  const handleClose = () => {
    setAnchorEl(null)
  }

  const setQuote = useSetAtom(quotedMsgAtom(threadHash))
  const peer = useAtomValue(
    peerAtom({
      id: msg.from,
    })
  )
  if (!peer) {
    return null
  }
  const isMe = peer.id === userId
  const cls = `flex ${
    contentAlign === "center" ? "items-center" : "items-start"
  } p-2.5 ${isMe ? "flex-row-reverse" : ""}`
  const buttons = []
  buttons.push({
    label: t("View"),
    handler: () => {
      if (onViewDetail) {
        onViewDetail()
      }
      setAnchorEl(null)
    },
  })
  if (isMe) {
    buttons.push({
      label: t("Recall"),
      handler: () => {
        sendMsg(threadHash, MsgOp.RECALL, {
          hash: msg.hash,
        })
        setAnchorEl(null)
      },
    })
  }
  buttons.push({
    label: t("Quote"),
    handler: () => {
      setQuote(msg)
      setAnchorEl(null)
    },
  })

  return (
    <div className={cls} data-hash={msg.hash}>
      <div className={isMe ? "ml-1" : "mr-1"}>
        <PeerAvatar id={peer.id} className="w-[38px] h-[38px] block" />
      </div>
      <div className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
        <div>
          {/* <div
            className={`flex ${
              isMe ? "flex-row-reverse" : "flex-row"
            } text-xs text-gray-400`}
          >
            {peer.nickName}
          </div> */}
          <Pressable
            pressingColor="transparent"
            threshold={300}
            as="div"
            ref={ref}
            onLongPress={() => {
              setAnchorEl(ref.current)
            }}
            onShortPress={() => {
              if (onClick) {
                onClick()
              }
            }}
            className={`flex flex-col gap-2 ${
              isMe ? "items-end" : "items-start"
            }`}
          >
            {children}
          </Pressable>
          <Hover
            isMe={isMe}
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            // open={true}
            onClose={handleClose}

            // TransitionComponent={Fade}
          >
            <div className="flex flex-row p-1">
              {buttons.map((button, i) => (
                <div
                  key={i}
                  onClick={button.handler}
                  className="inline-block text-sm text-white m-2 whitespace-nowrap"
                >
                  {button.label}
                </div>
              ))}
            </div>
          </Hover>
        </div>
      </div>
    </div>
  )
}
