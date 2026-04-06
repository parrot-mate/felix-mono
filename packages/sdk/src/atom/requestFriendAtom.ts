import { LangShort, MsgBodyMap, MsgKind, MsgOp, Voice } from "@pmate/meta"
import { atom } from "jotai"
import { ThreadUtils } from "@sdk/util/ThreadUtils"
import { profileAtom } from "@pmate/account-sdk"
import { sendMessageAtom } from "./sendMessageAtom"

interface Params {
  to: string
  text: string
  lang: LangShort
  voice: Voice
}

export const requestFriendAtom = atom(
  null,
  async (get, set, params: Params) => {
    const { to, text, lang, voice } = params
    const profile = get(profileAtom)
    const userId = profile?.id ?? ""
    if (!userId) {
      throw new Error("User not logged in")
    }

    const threadHash = ThreadUtils.dmHash(userId, to)
    const body: MsgBodyMap[MsgOp.TEXT] = {
      text,
      lang,
      voice: voice.key,
      instructions: voice.instructions || "",
      isAskingFriend: true,
    }

    await set(sendMessageAtom, MsgKind.DM, to, MsgOp.TEXT, body)
    return threadHash
  }
)
