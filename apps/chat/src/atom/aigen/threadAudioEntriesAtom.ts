import { learningLangAtom } from "@pmate/account-sdk"
import { ThreadUtils, threadMessagesV2Atom } from "@pmate/sdk"
import { LangShort, Msg, MsgBodyMap, MsgOp } from "@pmate/meta"
import type { CombinedResourceInput } from "@pmate/sdk"
import { atom } from "jotai"
import { atomFamily } from "jotai/utils"

type ThreadAudioEntriesParams = {
  threadHash: string
  userId: string
}

const buildContext = (messages: Msg<any>[], index: number) => {
  return messages
    .slice(Math.max(0, index - 5), index)
    .map((item) => {
      if (item.opcode !== MsgOp.TEXT) {
        return ""
      }
      const body = item.body as MsgBodyMap[MsgOp.TEXT]
      return body.text || ""
    })
    .filter(Boolean)
    .join("\n")
}

export const threadAudioEntriesAtom = atomFamily(
  ({ threadHash, userId }: ThreadAudioEntriesParams) =>
    atom((get) => {
      if (!threadHash || !userId) {
        return [] as CombinedResourceInput[]
      }

      const entityId = ThreadUtils.resolveEntityId(threadHash, userId)
      const { pages } = get(
        threadMessagesV2Atom({
          threadHash,
          entityId,
        })
      )
      const learningLang = get(learningLangAtom)

      const messages = pages
        .slice()
        .reverse()
        .flatMap((page) => page.messages)

      const entries: CombinedResourceInput[] = []

      messages.forEach((msg, index) => {
        if (msg.opcode !== MsgOp.TEXT) {
          return
        }
        const body = msg.body as MsgBodyMap[MsgOp.TEXT]
        const fromLang = body.lang as LangShort
        const targetLang = (learningLang || body.lang) as LangShort
        const isMe = msg.from === userId
        entries.push({
          key: msg.hash,
          init: {
            text: body.text,
            voice: body.voice,
            lang: targetLang,
            instructions: body.instructions,
            timePoints: false,
            group: isMe ? "me" : "other",
            translation:
              fromLang !== targetLang
                ? {
                    from: fromLang,
                    to: targetLang,
                    accuracy: "accurate",
                    context: buildContext(messages, index),
                  }
                : undefined,
          },
        })
      })

      return entries
    }),
  (a, b) => a.threadHash === b.threadHash && a.userId === b.userId
)
