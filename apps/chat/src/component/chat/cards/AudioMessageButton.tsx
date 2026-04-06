import { useMessageReadReporter } from "@/hook/useMessageReadReporter"
import { playSound } from "@pchip/components"
import { Msg, MsgBodyMap, MsgOp } from "@pmate/meta"
import { learningLangAtom } from "@pmate/account-sdk"
import {
  msgReadAtom,
  useCombinedResourceEntry,
  usePlayCombinedResource,
  useRoomContext,
} from "@pmate/sdk"
import { useAtomValue } from "jotai"
import { ReactNode, useMemo } from "react"
import { PlayVoiceIcon } from "./PlayVoiceIcon"

const PM_STATIC = (
  process.env.VITE_PUBLIC_PM_STATIC_URL ?? "https://parrot-static.pmate.chat"
).replace(/\/+$/, "")

const dingUrl = `${PM_STATIC}/ding.mp3`

export const AudioMessageButton = ({
  msg,
}: {
  msg: Msg<MsgOp.TEXT>
}) => {
  const body = msg.body as MsgBodyMap[MsgOp.TEXT]
  const text = body.text
  const learningLang = useAtomValue(learningLangAtom)

  const audioEntry = useCombinedResourceEntry(msg.hash)

  const { play, state, playKey, stop } = usePlayCombinedResource(msg.hash)

  const { threadHash, me } = useRoomContext()
  const userId = me.id
  const isRead = useAtomValue(
    msgReadAtom({
      user: userId,
      threadHash,
      hash: msg.hash,
    })
  )

  // 根据文本长度估一个宽度（保持你原来的风格）
  const len = useMemo(() => 40 + Math.min(text.length * 0.5, 240), [text])

  const reportMessageRead = useMessageReadReporter()

  const isMe = msg.from === userId

  const isPlaying = state === "playing" && playKey === msg.hash
  const isActive = isPlaying

  const handleClick = async () => {
    if (isPlaying) {
      stop()
      return
    }

    if (!audioEntry) return

    try {
      if (!isMe) {
        reportMessageRead({
          hash: msg.hash,
          threadHash,
        })
      }
      if (!learningLang.startsWith("zh")) {
        await playSound(dingUrl)
      }
      await play(msg.hash)
    } catch (err) {
      console.error(`[play]`, err)
    }
  }

  return (
    <Wrapper
      isMe={isMe}
      isRead={isRead}
      len={len}
      onClick={handleClick}
      isActive={isActive}
    >
      <PlayVoiceIcon isPlaying={isPlaying} />
      <div className="text-white text-[11px] leading-none px-1"></div>
    </Wrapper>
  )
}

const Wrapper = ({
  children,
  isMe,
  onClick,
  len,
  isActive,
  isRead,
}: {
  children: ReactNode
  isMe: boolean
  isRead: boolean
  len: number
  isActive: boolean
  onClick?: () => void
}) => {
  const active = isActive
  const baseColor = isMe
    ? isRead
      ? "bg-violet-200"
      : "bg-violet-500"
    : isRead
    ? "bg-pink-200"
    : "bg-pink-400"
  const textColor = isMe
    ? isRead
      ? "text-violet-500"
      : "text-white"
    : isRead
    ? "text-pink-400"
    : "text-white"
  return (
    <div onClick={onClick} role="button" aria-pressed={active}>
      <div
        style={{ width: `${len}px` }}
        className={`flex items-center ${
          isMe ? "flex-row-reverse" : "flex-row"
        } ${baseColor} ${textColor} rounded-[10px] transition-[background,box-shadow] duration-200 ease-out  h-8 px-1 select-none
          ${
            active
              ? isMe
                ? "shadow-[0_0_0_2px_rgba(255,255,255,.35)]"
                : "shadow-[0_0_0_2px_rgba(0,0,0,.08)]"
              : ""
          }`}
      >
        {children}
      </div>
    </div>
  )
}
