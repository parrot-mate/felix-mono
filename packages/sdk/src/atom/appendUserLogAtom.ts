import {
  Log,
  TopicNames,
  TS_Log,
  TS_Log_Init,
  TS_LogKind,
} from "@pmate/meta"
import { UserLogIndexer } from "@sdk/indexer"
import { atom } from "jotai"
import { apiAppendUserLog } from "@sdk/api"
import { IndexerNames } from "@sdk/util/cindexer.def"
import { getIndexer } from "./indexerAtom"
import { profileAtom } from "@pmate/account-sdk"

const appended = new Set<string>()
export const appendUserLogAtom = atom(null, async (get, _set, log: Log) => {
  const profile = await get(profileAtom)
  const userId = profile?.id ?? ""
  const logWithUser: Log = { ...log, user: log.user ?? userId }
  if (appended.has(logWithUser.hash)) {
    return
  }
  appended.add(logWithUser.hash)
  const indexer = getIndexer(IndexerNames.UserLogs, userId) as UserLogIndexer

  const topic = TopicNames.userLogs(userId)
  const kind = TS_LogKind.UserLogs
  const tsLog: TS_Log<Log> = {
    t: logWithUser.t,
    data: logWithUser,
    size: JSON.stringify(logWithUser).length,
    topic,
    kind,
    hash: logWithUser.hash,
  }
  indexer.aggregate(tsLog)
  const payload: TS_Log_Init<Log> = {
    data: logWithUser,
    kind,
    topic,
  }
  await apiAppendUserLog([payload])
})
