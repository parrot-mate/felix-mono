import { TopicNames } from "@pmate/meta"
import type {
  Account,
  Contact,
  GroupInfo,
  MappingLog,
  PM_Log,
  Profile,
  Room,
  TS_Log,
  UpdateEntityLog,
} from "@pmate/meta"
import { TS_LogKind } from "@pmate/meta"

type EntityCreatedParams<T> = {
  topic: string
  kind: TS_LogKind
  entity: T
}

type EntityUpdatedParams<T> = {
  topic: string
  kind: TS_LogKind
  id: string
  updated: Partial<T>
}

const createLog = <T>(topic: string, kind: TS_LogKind, data: T): TS_Log<T> => {
  const payload = JSON.stringify(data)
  return {
    topic,
    kind,
    data,
    t: Date.now(),
    hash: "",
    size: Buffer.byteLength(payload),
  }
}

export const TSLogBuilder = {
  mapping(payload: MappingLog): TS_Log<MappingLog> {
    return createLog(TopicNames.mapping(), TS_LogKind.Mapping, payload)
  },

  entityCreated<T>({
    topic,
    kind,
    entity,
  }: EntityCreatedParams<T>): TS_Log<{ type: "create"; after: T & { id: string } }> {
    return createLog(topic, kind, {
      type: "create",
      after: entity as T & { id: string },
    })
  },

  entityUpdated<T>({
    topic,
    kind,
    id,
    updated,
  }: EntityUpdatedParams<T>): TS_Log<UpdateEntityLog<T>> {
    return createLog(topic, kind, {
      type: "update",
      id,
      value: updated,
    } as UpdateEntityLog<T>)
  },

  roomCreated(room: Room): TS_Log<PM_Log<Room>> {
    return createLog(TopicNames.rooms(), TS_LogKind.Rooms, {
      type: "create",
      data: room,
    })
  },

  roomUpdated(room: Room): TS_Log<PM_Log<Room>> {
    return createLog(TopicNames.rooms(), TS_LogKind.Rooms, {
      type: "update",
      data: room,
    })
  },

  contactCreated(contact: Contact): TS_Log<PM_Log<Contact>> {
    return createLog(
      TopicNames.userContacts(contact.ownerId),
      TS_LogKind.UserContacts,
      {
        type: "create",
        data: contact,
      }
    )
  },

  contactDeleted(ownerId: string, contactId: string): TS_Log<PM_Log<Contact>> {
    return createLog(
      TopicNames.userContacts(ownerId),
      TS_LogKind.UserContacts,
      {
        type: "delete",
        id: contactId,
      }
    )
  },
}
