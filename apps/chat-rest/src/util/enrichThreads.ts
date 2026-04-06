import { GroupInfo, Profile, ThreadInfoV2, ThreadResponse } from "@pmate/meta"
import { IndexerQuery } from "@pmate/service-core"

export async function enrichThreads(
  threads: ThreadResponse[]
): Promise<ThreadInfoV2[]> {
  if (!threads.length) {
    return []
  }

  const profileIds = Array.from(
    new Set(
      threads
        .filter((thread) => thread.type === "dm")
        .map((thread) => thread.associated)
    )
  )
  const groupIds = Array.from(
    new Set(
      threads
        .filter((thread) => thread.type === "group")
        .map((thread) => thread.associated)
    )
  )

  const [profiles, groups] = await Promise.all([
    profileIds.length ? IndexerQuery.entities<Profile>(profileIds) : [],
    groupIds.length ? IndexerQuery.entities<GroupInfo>(groupIds) : [],
  ])
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]))
  const groupMap = new Map(groups.map((group) => [group.id, group]))

  return threads
    .map<ThreadInfoV2 | null>((thread) => {
      const base = {
        threadHash: thread.threadHash,
        type: thread.type,
        associatedId: thread.associated,
        lastUpdateAt: thread.lastUpdateAt,
        lastMessage: thread.lastMessage,
        total: thread.total,
        unread: thread.unread,
      }
      if (thread.type === "dm") {
        const profile = profileMap.get(thread.associated)
        if (!profile) {
          return null
        }
        return {
          ...base,
          name: profile?.nickName ?? "",
          avatar: profile?.avatar ?? "",
        }
      }
      const group = groupMap.get(thread.associated)
      if (!group) {
        return null
      }
      return {
        ...base,
        name: group?.title ?? "",
        avatar: group?.avatar ?? "",
      }
    })
    .filter((thread): thread is ThreadInfoV2 => thread !== null)
}
