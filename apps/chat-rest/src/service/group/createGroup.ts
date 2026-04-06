import { blockchain } from "../../blockchain"
import { GroupInfo, TopicNames, TS_LogKind } from "@pmate/meta"
import { generateAddress, TSLogBuilder } from "@pmate/service-core"

export type CreateGroupInput = Partial<Omit<GroupInfo, "id">>

export const createGroup = async (
  input: CreateGroupInput
): Promise<GroupInfo> => {
  const { ownerId, title, avatar } = input

  if (!ownerId) {
    throw new Error("ownerId is required")
  }
  if (!title) {
    throw new Error("title is required")
  }

  const members = new Set([ownerId, ...(input.members ?? [])])

  const group: GroupInfo = {
    id: generateAddress(),
    ownerId,
    title,
    avatar: avatar ?? "",
    members: [...members],
  }

  await blockchain.append(
    TSLogBuilder.entityCreated<GroupInfo>({
      topic: TopicNames.groups(),
      kind: TS_LogKind.Entity_GROUP,
      entity: group,
    })
  )

  return group
}
