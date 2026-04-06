import { UserLogIndexer } from "@sdk/indexer/UserLogIndexer"
import { UserMessageIndexer } from "@sdk/indexer/UserMessageIndexer"

export enum IndexerNames {
  UserMessages = "messages",
  UserLogs = "user_logs",
}

export const Indexers = {
  [IndexerNames.UserMessages]: UserMessageIndexer,
  [IndexerNames.UserLogs]: UserLogIndexer,
} as const

export type IndexersType = {
  [IndexerNames.UserMessages]: typeof UserMessageIndexer
  [IndexerNames.UserLogs]: typeof UserLogIndexer
}

export type IndexerDataType<TName extends IndexerNames> = ReturnType<
  IndexersType[TName]["prototype"]["fetch"]
>

type FirstParam<T> = T extends (arg: infer A, ...rest: any[]) => any ? A : never
export type IndexerParamType<TName extends IndexerNames> = FirstParam<
  IndexersType[TName]["prototype"]["fetch"]
>

export type IndexerInstanceType<TName extends IndexerNames> =
  TName extends IndexerNames.UserLogs
    ? UserLogIndexer
    : TName extends IndexerNames.UserMessages
    ? UserMessageIndexer
    : never

export interface IIndexer<TData, TParams, TReturn> {
  indexerName: IndexerNames
  aggregate: (data: TData) => void
  fetch: (params: TParams) => TReturn
  init: () => Promise<void>
  updateToLatest: () => Promise<void>
  startTime?: () => number
}