import { atom } from "jotai"
import { atomFamily } from "jotai/utils"
import { Endpoints } from "@sdk/config"
import { MultiPeerClient } from "@sdk/socket/MultiPeerClient"
import { profileAtom } from "@pmate/account-sdk"
import { realtimeClientAtom } from "./realtimeClientAtom"

const rtcCache: Record<string, MultiPeerClient> = {}

export const rtcAtom = atomFamily((user: string) => {
  return atom(async (get) => {
    const profile = await get(profileAtom)
    const userId = profile?.id ?? ""
    if (!userId) {
      return null
    }

    const socketClient = await get(realtimeClientAtom(Endpoints.room))
    return (rtcCache[user] ||= new MultiPeerClient(user, socketClient))
  })
})
