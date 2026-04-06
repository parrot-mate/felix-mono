import { Msg, MsgOp } from "@pmate/meta"
import { Suspense } from "react"
import type { VirtualizedState } from "../VirtualizedList"
import { EmojiMessageCard } from "./EmojiMessageCard"
import { GroupPeersMessageCard } from "./GroupPeersMessageCard"
import { ImageMessageCard } from "./ImageMessageCard"
import { TextMessageCard } from "./TextMessageCard"

type MsgProps<T extends MsgOp> = {
  msg: Msg<T>
}

type MessageCardProps = MsgProps<any> & {
  virtualState?: VirtualizedState
  visible?: boolean
}

function renderMsg(msg: Msg<any>, virtualState?: VirtualizedState) {
  const { opcode } = msg

  switch (opcode) {
    case MsgOp.EMOJI:
      return <EmojiMessageCard msg={msg} />
    case MsgOp.TEXT:
      return <TextMessageCard msg={msg} virtualState={virtualState} />
    case MsgOp.IMAGE:
      return <ImageMessageCard msg={msg} />
    case MsgOp.GROUP_NEW_PEERS:
    case MsgOp.GROUP_REMOVE_PEERS:
      return <GroupPeersMessageCard msg={msg} />
  }
  return null
}

const MessageCardSkeleton = () => {
  return (
    <div className="px-3 py-2">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
        <div className="flex-1">
          <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    </div>
  )
}

export const MessageCard = ({
  msg,
  virtualState,
  visible,
}: MessageCardProps) => {
  return (
    <div
      className="min-h-[60px]"
      style={{
        visibility: visible === false ? "hidden" : "visible",
      }}
    >
      <Suspense fallback={<MessageCardSkeleton />}>
        {renderMsg(msg, virtualState)}
      </Suspense>
    </div>
  )
}
