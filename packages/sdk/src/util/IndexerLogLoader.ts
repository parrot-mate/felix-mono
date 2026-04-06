import { Logger } from "@pmate/utils"
import { Msg } from "@pmate/meta"
import { ChunkService } from "@sdk/api/ChunkService"
import { TimeLogDB } from "./TimeLogDB"

type LoggerLike = {
  log: (message: string, payload?: Record<string, unknown>) => void
}

export type LoaderOptions = {
  indexerName: string
  userId: string
  retentionWindowMs: number
  logger?: LoggerLike
}

const logger = Logger.getDebugger("IndexerLogLoader")
export class IndexerLogLoader {
  private logDB: TimeLogDB | null = null

  public constructor(private readonly options: LoaderOptions) {}

  public ensureLogDB(): TimeLogDB | null {
    if (this.logDB) {
      return this.logDB
    }

    try {
      this.logDB = new TimeLogDB({
        dbName: `${this.options.indexerName}-log`,
        storeName: `message-${this.options.userId}`,
      })
    } catch (error) {
      logger.log("Failed to initialize TimeLogDB", { error })
      this.logDB = null
    }

    return this.logDB
  }

  public async load(params?: Record<string, any>): Promise<any[]> {
    const db = this.ensureLogDB()
    if (!db) {
      return []
    }

    const lastLogTime = await db.lastUpdate()

    try {
      logger.log("Fetching remote logs", this.options.indexerName, params)
      const remoteLogs = await ChunkService.fetchLogs<any>(
        this.options.indexerName,
        { ...params }, // Query
        {
          maxPage: 5,
          startTime: lastLogTime,
          ...params,
        }
      )
      if (remoteLogs.length) {
        await db.putMany(remoteLogs)
      }
    } catch (error) {
      logger.log("Failed to fetch remote logs", { error })
      throw error
    }

    const since = Date.now() - this.options.retentionWindowMs
    return this.collectRecentLogs(db, since)
  }

  private async collectRecentLogs(
    db: TimeLogDB,
    since: number
  ): Promise<Msg<any>[]> {
    const pageSize = 200
    let page = 0
    const collected: Msg<any>[] = []

    while (true) {
      const batch = (await db.query(page, pageSize)) as Msg<any>[]
      if (!batch.length) {
        break
      }

      collected.push(...batch)
      const oldest = batch[0]?.t ?? Number.POSITIVE_INFINITY
      if (oldest <= since || batch.length < pageSize) {
        break
      }

      page += 1
    }

    return collected.filter((log) => log.t >= since).sort((a, b) => a.t - b.t)
  }
}