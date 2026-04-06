import type { UserRole } from "./account.types"
import type { Contact, PM_Log, RelationshipLog, Room } from "./chat.types"
import type { LangShort } from "./lang.types"
import type { Msg } from "./message.types"
import type { Log } from "./newLog.types"

export type Entity<T> = {
  id: string
} & T

export type ProfileInfo = {
  app: string // Associated app
  account: string // Associated Account Address
  /** unique user name */
  userName: string
  nickName: string
  /** avatar url */
  avatar: string
  gender?: "F" | "M"
  email?: string
  motherTongue: LangShort
  learningTargetLang: LangShort
  /** user role */
  role: UserRole

  /* uniq account name */
  name: string
}

export type Profile = Entity<ProfileInfo>

export interface EntityLogActor {
  /** actor unique identifier */
  id: string
  /** actor role when the change happened */
  role?: UserRole
}

export interface CreateEntityLog<T> {
  type: "create"
  after: Entity<T>
}

export type DeleteEntityLog = {
  type: "delete"
  id: string
}

export interface UpdateEntityLog<T> {
  type: "update"
  id: string
  value: Partial<Entity<T>>
}

export interface DeleteEntity {
  type: "delete"
  id: string
}

export type EntityLog<T> =
  | CreateEntityLog<T>
  | DeleteEntityLog
  | UpdateEntityLog<T>

export interface TS_Block_Meta {
  topic: string
  start: number
  end: number
  id: string
  size: number
  count: number
  ossKey?: string
  localPath?: string
  created: number
}

export interface TS_Block {
  meta: TS_Block_Meta
  logs: TS_Log<any>[]
}

export enum TS_LogKind {
  Unknown = 0,
  UserLogs = 1000,
  UserMessages = 2000,
  UserReadMessage = 2001,
  Relationships = 3000,
  Rooms = 4000,
  UserContacts = 5000,
  UserMapping = 6000,
  Mapping = 6003,
  UserMobileMapping = 7000,
  Entity_PROFILE = 8000,
  Entity_ACCOUNT = 8001,
  Entity_GROUP = 8002,
  UserThreads = 9000,

  STD_TABLE = 10_000,
  STD_MAP = 10_001,
  APP_LOG = 10_002,
}

export interface TS_Log<TData> extends TimeLog {
  data: TData
  size: number
  kind: TS_LogKind
  topic: string
}

export interface TS_Log_Init<TData> {
  data: TData
  kind: TS_LogKind
  topic: string
}

export interface TS_RESPONSE {
  topic: string
  blocks: string[] // Included block ids
  logs: TS_Log<any>[] // Only the logs in tmp ( not in the block files )
}

export interface TS_Topic_Define {
  path: RegExp // path of topic, allow something like aaaa/*
  blockTime: number // How Long we generate new blocks
  blockSize: number // Size we generate new blocks
  flushInterval: number // time for flush, 0 for immediately for every append.
}

export interface UserMappingLog {
  profileId: string
  userName: string
}

export interface STDMappingLog<T> {
  key: string
  value: T
}

export interface UserMobileMappingLog {
  mobile: string
  accountId: string
}

export interface UserThreadLog {
  threadId: string
  userId: string
}

export interface UserReadMessageLog {
  userId: string
  hash: string
  threadHash: string
}

export interface TSLogKindPayloadMap {
  [TS_LogKind.Unknown]: unknown
  [TS_LogKind.UserLogs]: Log
  [TS_LogKind.UserMessages]: Msg<any>
  [TS_LogKind.UserReadMessage]: UserReadMessageLog
  [TS_LogKind.Relationships]: RelationshipLog
  [TS_LogKind.Rooms]: PM_Log<Room>
  [TS_LogKind.UserContacts]: PM_Log<Contact>
  [TS_LogKind.UserMapping]: UserMappingLog
  [TS_LogKind.UserMobileMapping]: UserMobileMappingLog
  [TS_LogKind.Mapping]: MappingLog
  [TS_LogKind.Entity_ACCOUNT]: EntityLog<any>
  [TS_LogKind.Entity_GROUP]: EntityLog<any>
  [TS_LogKind.Entity_PROFILE]: EntityLog<any>
  [TS_LogKind.UserThreads]: UserThreadLog
  [TS_LogKind.STD_TABLE]: EntityLog<any> // Standard table log
  [TS_LogKind.STD_MAP]: STDMappingLog<any> // Standard map log
  [TS_LogKind.APP_LOG]: any
}

export interface MappingLog {
  key: string
  value: any
}

export type TSLogKindPayload<K extends TS_LogKind> = TSLogKindPayloadMap[K]

export interface TimeLog {
  hash: string
  t: number
}

export type StdTableAppendInput<T> = T & { id: string }
export type StdTableUpdateInput<T> = Partial<T> & { id: string }

const createLogHash = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

const buildTimeLog = (): TimeLog => ({
  t: Date.now(),
  hash: createLogHash(),
})

export const buildStdTableCreateLog = <T>(
  topic: string,
  data: StdTableAppendInput<T>
): TS_Log_Init<EntityLog<T>> => ({
  kind: TS_LogKind.STD_TABLE,
  topic,
  data: { type: "create", after: data as Entity<T> },
  ...buildTimeLog(),
})

export const buildStdTableUpdateLog = <T>(
  topic: string,
  data: StdTableUpdateInput<T>
): TS_Log_Init<EntityLog<T>> => {
  const { id, ...value } = data as StdTableUpdateInput<T> &
    Record<string, unknown>
  return {
    kind: TS_LogKind.STD_TABLE,
    topic,
    data: { type: "update", id, value: value as Partial<Entity<T>> },
    ...buildTimeLog(),
  }
}

export const buildStdTableDeleteLog = (
  topic: string,
  id: string
): TS_Log_Init<EntityLog<any>> => ({
  kind: TS_LogKind.STD_TABLE,
  topic,
  data: { type: "delete", id },
  ...buildTimeLog(),
})

export const buildStdMapSetLog = <T>(
  topic: string,
  key: string,
  value: T
): TS_Log_Init<STDMappingLog<T>> => ({
  kind: TS_LogKind.STD_MAP,
  topic,
  data: { key, value },
  ...buildTimeLog(),
})
