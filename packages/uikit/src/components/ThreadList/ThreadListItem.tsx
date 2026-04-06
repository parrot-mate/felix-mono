import { MsgOp, type Msg, type ThreadInfoV2 } from "@pmate/meta"
import React from "react"
import type { BaseComponentProps } from "../../types/base"
import { Avatar } from "../Avatar"
import { UnreadBadge } from "../UnreadBadge"
import { format, isToday, isThisYear } from "date-fns"

export type ThreadListItemProps = BaseComponentProps &
  ThreadInfoV2 & {
    onClick?: () => void
  }

function formatMsg(msg: Msg<any>): string {
  switch (msg.opcode) {
    case MsgOp.TEXT:
      return msg.body.text
    case MsgOp.IMAGE:
      return "[Image]"
    case MsgOp.EMOJI:
      return msg.body.code
    case MsgOp.HELLO:
      return ""
    default:
      return ""
  }
}

function formatTimestamp(ts: number | string | undefined) {
  if (ts == null) return ""
  const n = Number(ts)
  const tsMs = String(Math.floor(Math.abs(n))).length === 13 ? n : n * 1000
  const d = new Date(tsMs)

  if (isToday(d)) {
    return format(d, "HH:mm") // 今天显示 24小时制
  }

  if (isThisYear(d)) {
    return format(d, "M月d日") // 同年只显示月日
  }

  return format(d, "yyyy年M月d日") // 跨年显示年月日
}

export const ThreadListItem: React.FC<ThreadListItemProps> = ({
  avatar,
  name,
  lastMessage,
  unread = 0,
  onClick,
  className = "",
  id,
  styles,
}) => {
  const time = lastMessage?.t
  const rawText = lastMessage ? formatMsg(lastMessage) : "( no message )"
  const text = rawText.length > 20 ? `${rawText.slice(0, 20)}…` : rawText

  return (
    <li
      id={id}
      data-uikit="thread_list_item"
      style={styles}
      className={`relative flex items-center pl-2.5 cursor-pointer ${className}`.trim()}
      onClick={onClick}
    >
      {/* 左边头像，不要下划线 */}
      <Avatar
        src={avatar}
        size="large"
        nickName={name}
        className="w-12 h-12 mr-3"
      />

      {/* 右边文字 + 未读 + 时间 */}
      <div className="flex justify-between items-center pl-0.5 pr-3 flex-1 py-4 border-b border-gray-300">
        <div className="flex flex-col min-w-0">
          <p className="text-base truncate">{name}</p>
          <p className="text-sm text-gray-500 truncate h-4">{text}</p>
        </div>

        {/* 右侧时间 */}
        <span className="ml-3 shrink-0 text-xs text-gray-400 self-start mt-1">
          {formatTimestamp(time as any)}
        </span>

        {/* 未读角标（绝对定位） */}
        <div className="absolute top-4 left-11">
          <UnreadBadge count={unread} />
        </div>
      </div>
    </li>
  )
}
