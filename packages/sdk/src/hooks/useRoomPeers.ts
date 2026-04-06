import { Profile, RoomPeerInfo } from "@pmate/meta"
import { EntityService } from "@sdk/api"
import { useRoomContext } from "@sdk/provider/RoomProvider"
import { atom, useAtomValue } from "jotai"
import { atomFamily, unwrap } from "jotai/utils"
import { isEqual } from "lodash"
import { useMemo } from "react"

const groupPeersAtom = atomFamily((groupId: string) => {
  return unwrap(
    atom(async () => {
      if (!groupId) return [] as RoomPeerInfo[]
      const group = await EntityService.getGroup(groupId)
      if (!group) return [] as RoomPeerInfo[]
      const members = group.members || []
      if (!members.length) return [] as RoomPeerInfo[]
      const profileMap = await EntityService.entities<Profile>(members)
      return members
        .map((memberId) => {
          const profile = profileMap[memberId]
          if (!profile) return null
          return toRoomPeer(profile)
        })
        .filter((peer): peer is RoomPeerInfo => !!peer)
    }),
    (prev) => prev ?? []
  )
}, isEqual)

const toRoomPeer = (profile: Profile): RoomPeerInfo => ({
  ...profile,
  gender: profile.gender ?? "",
  isOnline: true,
})

export const useRoomPeers = () => {
  const { roomType, me, other, toId } = useRoomContext()
  const groupPeers = useAtomValue(
    groupPeersAtom(roomType === "group" ? toId : "")
  )

  const peers = useMemo(() => {
    if (roomType === "dm") {
      return [toRoomPeer(me), ...(other ? [toRoomPeer(other)] : [])]
    }
    return groupPeers
  }, [groupPeers, me, other, roomType])

  const peerMap = useMemo(() => {
    return peers.reduce<Record<string, RoomPeerInfo>>((acc, peer) => {
      acc[peer.id] = peer
      return acc
    }, {})
  }, [peers])

  return { peers, peerMap }
}
