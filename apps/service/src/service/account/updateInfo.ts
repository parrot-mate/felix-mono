import { blockchain } from "../../blockchain"
import {
  Profile,
  TopicNames,
  TS_LogKind,
  UpdateProfileRequest,
} from "@pmate/meta"
import { TSLogBuilder } from "@pmate/service-core"

export const updateInfo = async (req: UpdateProfileRequest) => {
  const { profileId, ...payload } = req
  const changes = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  )

  if (!profileId || Object.keys(changes).length === 0) {
    return
  }

  await blockchain.append(
    TSLogBuilder.entityUpdated<Profile>({
      id: profileId,
      topic: TopicNames.profiles(),
      kind: TS_LogKind.Entity_PROFILE,
      updated: changes,
    })
  )
}
