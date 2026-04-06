import { ThreadRender } from "@/component/chat/ThreadRender"
import { MicProvider } from "@/provider/MicContextProvider"
import { profileAtom } from "@pmate/account-sdk"
import { RoomParams, RoomProvider } from "@pmate/sdk"
import { useAtomValue } from "jotai"
import { useParams } from "react-router"

export const ChatRoom = () => {
  const { toId, groupId } = useParams<{ toId?: string; groupId?: string }>()
  const profile = useAtomValue(profileAtom)
  const me = profile?.id ?? ""
  const params = {
    me,
    type: toId ? "dm" : ("group" as const),
    ...(toId ? { toId } : {}),
    ...(groupId ? { groupId } : {}),
  } as RoomParams

  return (
    <RoomProvider {...params}>
      <MicProvider id="chat">
        <ThreadRender />
      </MicProvider>
    </RoomProvider>
  )
}

export default ChatRoom
