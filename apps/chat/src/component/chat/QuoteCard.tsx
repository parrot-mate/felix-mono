import { peerAtom, quotedMsgAtom, useRoomContext } from "@pmate/sdk"
import { Msg, MsgOp } from "@pmate/meta"
import { useTranslation } from "@pmate/i18n"
import { useAtomValue, useSetAtom } from "jotai"
import { FC } from "react"
import { IconButton, IconCancel } from "@pmate/uikit"

interface QuoteCardProps {
  quoted: Msg<MsgOp>
  showRemove?: boolean
  className?: string
  showLabel?: boolean
}
export const QuoteCard: FC<QuoteCardProps> = ({
  quoted,
  className,
  showRemove = true,
  showLabel = true,
}) => {
  const body = quoted.body as any
  const { threadHash } = useRoomContext()
  const t = useTranslation()
  const peer = useAtomValue(peerAtom({ id: quoted.from }))
  const removeQuote = useSetAtom(quotedMsgAtom(threadHash))
  const isEmoji = quoted.opcode === MsgOp.EMOJI
  if (!peer) {
    return null
  }

  return (
    <div
      className={`flex flex-row bg-gray-200 rounded-md border-1 border-gray-300 rounded-2 p-1 text-xs ${className}`}
    >
      <div>
        {showLabel && <span className="text-gray-500">{t("Quote")}</span>}
        <span className="ml-1 mr-2">{peer.nickName}</span>
      </div>
      {isEmoji ? (
        <div className="text-2xl">{body.code}</div>
      ) : (
        <div>{body.text}</div>
      )}
      {showRemove && (
        <IconButton
          className="h-full p-0"
          onClick={() => {
            removeQuote(null)
          }}
        >
          <IconCancel className="w-4 h-4" />
        </IconButton>
      )}
    </div>
  )
}
