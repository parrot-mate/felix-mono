import { blockchain } from "../../blockchain"
import { GroupInfo, TopicNames, TS_LogKind } from "@pmate/meta"
import { TSLogBuilder } from "@pmate/service-core"

export type UpdateGroupInput = Partial<GroupInfo>

export const updateGroup = async (input: UpdateGroupInput) => {
  const { id, ...rest } = input
  if (!id) {
    throw new Error("id is required")
  }

  const updatedEntries = Object.entries(rest).filter(
    ([, value]) => value !== undefined
  )
  if (!updatedEntries.length) {
    return
  }

  const updated = updatedEntries.reduce<Partial<GroupInfo>>(
    (acc, [key, value]) => {
      ;(acc as any)[key] = value
      return acc
    },
    {}
  )

  await blockchain.append(
    TSLogBuilder.entityUpdated<GroupInfo>({
      id,
      topic: TopicNames.groups(),
      kind: TS_LogKind.Entity_GROUP,
      updated,
    })
  )
}
