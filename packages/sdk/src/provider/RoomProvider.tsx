import { Logger } from "@pmate/utils"
import type {
  GroupInfo,
  LangShort,
  Profile,
  RelationshipStatus,
  RoomPeerInfo,
  RoomType,
  UserRole,
  Voice,
} from "@pmate/meta"
import {
  entityAtom,
  peerAtom,
  relationshipAtom,
  threadsAtomV2,
  userSettingsAtom,
} from "@sdk/atom"
import { profileAtom } from "@pmate/account-sdk"
import { useRefreshThreadOnConnect } from "@sdk/hooks"
import { NotAuthenticatedError } from "@sdk/util/errors"
import { ThreadUtils } from "@sdk/util/ThreadUtils"
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai"
import { atomFamily, unwrap } from "jotai/utils"
import { isEqual } from "lodash"
import { createContext, Suspense, useContext, useEffect, useMemo } from "react"

export type RoomParams =
  | {
      type: "dm"
      me: string
      toId: string
    }
  | {
      type: "group"
      me: string
      groupId: string
    }
export interface RoomContext {
  threadHash: string
  toId: string
  peers: RoomPeerInfo[]
  other?: Profile
  me: Profile
  relationship?: RelationshipStatus
  isFriend: boolean
  motherLang: LangShort
  learningLang: LangShort
  role: UserRole
  roomType: RoomType
  roomInfo: { title?: string; avatar?: string }
  chatVoice: Voice
}

const logger = Logger.getDebugger("RoomProvider")
// store it on globalThis so Fast Refresh/HMR reuses the same context
const globalKey = "__RoomContext__"

type RoomContextValue = RoomContext | null

export const RoomContext: React.Context<RoomContextValue> =
  (globalThis as any)[globalKey] ||
  ((globalThis as any)[globalKey] = createContext<RoomContextValue>(null))
// const RoomContext = createContext<RoomContext | null>(null)
export const useRoomContext = () => {
  const ctx = useContext(RoomContext)
  if (!ctx) {
    throw new Error("RoomContext is not ready")
  }
  return ctx
}

const chatVoiceAtom = unwrap(
  atom(async (get) => {
    const voice = await get(userSettingsAtom("chatVoice@v2"))
    return voice
  }),
  (prev) => prev
)

const roomContextAtom = atomFamily((_: RoomParams) => {
  return atom<RoomContext | null>(null)
}, isEqual)

function getThreadHash(params: RoomParams) {
  if (params.type === "dm") {
    return ThreadUtils.dmHash(params.me, params.toId)
  }
  return ThreadUtils.groupHash(params.groupId)
}

const SyncRoomContext = (params: RoomParams) => {
  const threadHash = getThreadHash(params)

  const profile = useAtomValue(profileAtom)
  const { me: myId, type } = params
  const me = useAtomValue(peerAtom({ id: myId }))
  if (!me) {
    throw new NotAuthenticatedError()
  }
  const otherPeerId = type === "dm" ? params.toId : ""
  const toId = type === "dm" ? otherPeerId : params.groupId
  const other =
    type === "dm" ? useAtomValue(peerAtom({ id: otherPeerId })) : undefined
  if (!other && type === "dm") {
    throw new NotAuthenticatedError()
  }

  const entity = useAtomValue(entityAtom({ type, id: toId }))
  const room = useMemo(() => {
    if (!entity) return null
    if (type === "group") {
      const group = entity as GroupInfo
      return { title: group.title, avatar: group.avatar }
    }
    const profileEntity = entity as Profile
    return { title: profileEntity.nickName, avatar: profileEntity.avatar }
  }, [entity, type])
  const relationship =
    type === "dm"
      ? useAtomValue(relationshipAtom({ from: otherPeerId, to: myId }))
      : undefined
  const isFriend = relationship === "agreed"
  const chatVoice = useAtomValue(chatVoiceAtom)

  const [ctx, setCtx] = useAtom(roomContextAtom(params))
  const refreshThreads = useSetAtom(threadsAtomV2(myId))
  useRefreshThreadOnConnect(myId, threadHash)

  useEffect(() => {
    const lastReceive = Number(
      localStorage.getItem("msg-last-receive-time") || "0"
    )
    if (Date.now() - lastReceive > 10000) {
      refreshThreads()
    }
  }, [refreshThreads])

  logger.log("ctx", { room, me, profile, chatVoice, myId, threadHash, other })
  useEffect(() => {
    if (!room || !me || !profile || !chatVoice) return
    if (type === "dm" && !other) return
    setCtx({
      threadHash,
      toId,
      peers: [],
      other: other || undefined,
      me,
      relationship,
      isFriend,
      motherLang: profile.motherTongue,
      learningLang: profile.learningTargetLang,
      role: profile.role,
      roomType: type,
      roomInfo: room,
      chatVoice,
    })
  }, [
    room,
    other,
    me,
    relationship,
    profile,
    chatVoice,
    threadHash,
    toId,
    type,
  ])

  return null
}

export const RoomProvider = ({
  children,
  ...params
}: {
  children: React.ReactNode
} & RoomParams) => {
  const roomContext = useAtomValue(roomContextAtom(params))
  logger.log(roomContext)

  return (
    <>
      <RoomContext.Provider value={roomContext}>
        {roomContext ? children : <div></div>}
      </RoomContext.Provider>
      <Suspense>
        <SyncRoomContext {...params} />
      </Suspense>
    </>
  )
}
