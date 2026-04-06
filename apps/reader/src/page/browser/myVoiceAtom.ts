import { Api, ProfileService } from "@pmate/sdk"
import { atom } from "jotai"
import { atomFamily, atomWithRefresh } from "jotai/utils"

const STATIC_URL = (
  process.env.VITE_PUBLIC_RESOURCE_URL ?? "https://book.skedo.cn"
).replace(/\/+$/, "")

export const myAudioAtom = atomFamily((userId: string) =>
  atomWithRefresh(async () => {
    const url = `${STATIC_URL}/users/${userId}/my-voice/voice.wav`
    const exists = await Api.exists(url)
    if (!exists) {
      return null
    }
    return url
  })
)

export const uploadMyVoiceAtom = atom(
  null,
  async (_, set, user: string, base64: string, text: string) => {
    await ProfileService.updateMyVoice({
      user,
      base64,
      text,
    })
    set(myAudioAtom(user))
  }
)
