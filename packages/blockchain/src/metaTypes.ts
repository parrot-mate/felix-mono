export type Entity<T> = {
  id: string
} & T

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

export type EntityLog<T> =
  | CreateEntityLog<T>
  | DeleteEntityLog
  | UpdateEntityLog<T>

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

export type ChainId = "pmate" | "test"

export interface TimeLog {
  hash: string
  t: number
}

export interface TS_Log<TData> extends TimeLog {
  data: TData
  size: number
  kind: TS_LogKind | number
  topic: string
}

export interface TS_Log_Init<TData> {
  data: TData
  kind: TS_LogKind | number
  topic: string
}

export interface STDMappingLog<T> {
  key: string
  value: T
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

export const buildMappingSetLog = <T>(
  topic: string,
  key: string,
  value: T
): TS_Log_Init<STDMappingLog<T>> => ({
  kind: TS_LogKind.Mapping,
  topic,
  data: { key, value },
  ...buildTimeLog(),
})
