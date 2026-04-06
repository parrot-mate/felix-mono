import {
  Emitter,
  HashType,
  Logger,
  calculateSHA1Hash,
  memoizeAsync,
  uniqHash,
} from "@pmate/utils"
import { BaseLog, Log, LogType, LogTypeMap, TS_Log } from "@pmate/meta"
import { IndexerLogLoader } from "@sdk/util/IndexerLogLoader"
import { IIndexer, IndexerNames } from "@sdk/util/cindexer.def"
import { AggregatorData, AggregatorEvent, UserState } from "./UserState"
export { AggregatorEvent } from "./UserState"

const logger = Logger.getDebugger("userLogIndexer")

type IndexerParams = void
type IndexerResult = AggregatorData
type AggregateInput = Log | TS_Log<Log>

export class UserLogIndexer
  implements IIndexer<AggregateInput, IndexerParams, IndexerResult>
{
  public readonly indexerName = IndexerNames.UserLogs
  private readonly emitter = new Emitter<AggregatorEvent>()
  private readonly retentionWindowMs = Number.MAX_SAFE_INTEGER
  private readonly logLoader: IndexerLogLoader
  private readonly state = new UserState(this.emitter)

  private constructor(private readonly userId: string) {
    this.logLoader = new IndexerLogLoader({
      indexerName: this.indexerName,
      userId: this.userId,
      retentionWindowMs: this.retentionWindowMs,
      logger,
    })
  }

  public aggregate(entry: AggregateInput) {
    const log = this.normalizeLog(entry)
    const db = this.logLoader.ensureLogDB()
    if (db) {
      void db.put(log)
    }
    this.state.aggregate(log)
  }

  private normalizeLog(entry: AggregateInput): Log {
    const ensureUser = (log: Log): Log => ({
      ...log,
      user: log.user ?? this.userId,
    })

    if ("topic" in entry) {
      return ensureUser({
        ...entry.data,
        hash: entry.hash ?? entry.data.hash,
        t: entry.t ?? entry.data.t,
      })
    }
    return ensureUser(entry)
  }

  public fetch(): AggregatorData {
    return this.state.fetch()
  }

  public init = memoizeAsync(this.updateToLatest.bind(this), {
    isValid: () => true,
  })

  /**
   * 从服务端拉取最新日志并重建索引
   * 用于初始化和 WebSocket 重连后同步
   */
  public async updateToLatest() {
    logger.log("Updating user logs to latest")
    const logs = await this.logLoader.load({
      user: this.userId,
    })
    this.rebuildFromCache(logs)
    logger.log("User logs updated successfully", { count: logs.length })
  }

  private rebuildFromCache(logs: Log[]) {
    this.state.rebuild(logs)
  }

  public startTime(): number {
    return 0
  }

  public on<TPayload = unknown>(
    event: AggregatorEvent,
    handler: (payload: TPayload) => void
  ) {
    return this.emitter.on(event, handler)
  }

  private static _instanceMap: Map<string, UserLogIndexer> = new Map()

  public static create(userId: string) {
    if (!this._instanceMap.has(userId)) {
      this._instanceMap.set(userId, new UserLogIndexer(userId))
    }
    return this._instanceMap.get(userId)!
  }
}

export async function hashUserLog(log: Log) {
  switch (log.type) {
    case LogType.Reading: {
      return calculateSHA1Hash(`${log.type}/${log.data.book}-${log.data.pid}`)
    }
    case LogType.UserNotes: {
      return calculateSHA1Hash(
        `${log.type}/${log.data.title}-${log.data.content}`
      )
    }
    case LogType.Vocabulary: {
      return calculateSHA1Hash(
        `${log.type}/${log.data.word}-${log.data.action}-${log.t}`
      )
    }
    case LogType.Mint: {
      return calculateSHA1Hash(`${log.type}/${log.data.key}`)
    }
    case LogType.UserSettings: {
      return uniqHash(`${log.type}/${log.data.key}/${log.t}`, HashType.UserLog)
    }
    case LogType.Books: {
      return calculateSHA1Hash(`${log.type}/${log.data.book.id}-${log.data.op}`)
    }
    case LogType.ContextQA: {
      return calculateSHA1Hash(
        `${log.type}/${log.data.bookId}:${log.data.paragraphId}-${log.data.role}-${log.data.text}`
      )
    }
    default:
      throw new Error("Unknown log type.")
  }
}

export async function createUserLog<TType extends LogType>(
  type: TType,
  data: LogTypeMap[TType],
  user: string
) {
  const log: BaseLog<TType> = {
    t: Date.now(),
    type,
    user,
    data,
    hash: "",
  }
  log.hash = await hashUserLog(log as unknown as Log)
  return log
}
