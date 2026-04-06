import { Logger, memoizeAsync } from "@pmate/utils"
import { Msg, ThreadInfo } from "@pmate/meta"
import { IndexerLogLoader } from "@sdk/util/IndexerLogLoader"
import { IIndexer, IndexerNames } from "@sdk/util/cindexer.def"
import {
  LogFunction,
  UserMessageState,
} from "./UserMessageState"

const logger = Logger.getDebugger("userMessageIndexer")

type IndexerParams = {
  thread?: string
  page?: number
}

type IndexerResult = Record<string, ThreadInfo> | ThreadInfo | null

export class UserMessageIndexer
  implements IIndexer<Msg<any>, IndexerParams, IndexerResult>
{
  public readonly indexerName = IndexerNames.UserMessages
  private readonly sevenDaysInMs = 7 * 24 * 60 * 60 * 1000
  private readonly logLoader: IndexerLogLoader
  private readonly userId: string
  private readonly state: UserMessageState

  public constructor(userId: string) {
    this.userId = userId
    this.logLoader = new IndexerLogLoader({
      indexerName: this.indexerName,
      userId,
      retentionWindowMs: this.sevenDaysInMs,
      logger,
    })
    const logFn: LogFunction = (message, context) => {
      logger.log(message, context)
    }
    this.state = new UserMessageState(logFn)
  }

  public aggregate(data: Msg<any>) {
    const db = this.logLoader.ensureLogDB()
    if (db) {
      void db.put(data)
    }
    this.state.aggregate(data)
  }

  public startTime(): number {
    return Date.now() - 2 * 24 * 60 * 60 * 1000
  }

  public fetch(param?: IndexerParams) {
    const { thread, page } = param || {}
    if (thread) {
      const info = this.state.getThread(thread)
      if (!info) {
        return null
      }
      const list = page
        ? info.msgs.slice(page * 100, page * 100 + 100)
        : info.msgs
      const newInfo: ThreadInfo = { ...info, msgs: list }
      return newInfo
    }
    return this.state.getAll()
  }

  public init = memoizeAsync(this.updateToLatest.bind(this), {
    isValid: () => true,
  })

  /**
   * 从服务端拉取最新消息并重建索引
   * 用于初始化和 WebSocket 重连后同步
   */
  public async updateToLatest() {
    logger.log("Updating user messages to latest")
    const logs = await this.logLoader.load({
      user: this.userId,
    })
    this.rebuildFromCache(logs)
    logger.log("User messages updated successfully", { count: logs.length })
  }

  private rebuildFromCache(logs: Msg<any>[]) {
    this.state.rebuild(logs)
  }

  private static _instanceMap: Map<string, UserMessageIndexer> = new Map()
  public static create(userId: string) {
    if (!this._instanceMap.has(userId)) {
      this._instanceMap.set(userId, new UserMessageIndexer(userId))
    }
    return this._instanceMap.get(userId)!
  }
}
