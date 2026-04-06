import { IndexerRestClient } from "./indexer/IndexerRestClient"
import { BlockLogAppender } from "./logAppender"
import type { ChainId, TS_Log, TS_Log_Init } from "./metaTypes"
import { StdMap } from "./StdMap"
import { StdTable } from "./StdTable"
import type { Block } from "./types"
import { assertTopicFormat } from "./topic"

const BLOCK_TIME_MS = 1_500

export type AppendOptions = {
  waitForBlockTime?: number
}

export type BlockStreamOptions = {
  startBlockId?: number
  pollIntervalMs?: number
  includePendingUpdates?: boolean
}

export type LogStreamOptions = {
  startBlockId?: number
  pollIntervalMs?: number
}

export type BlockchainOptions = {
  chainId: ChainId
  baseUrl: string
  indexerBaseUrl: string
}

const waitBlock = async (n: number) => {
  const durationMs = Math.max(0, Math.floor(BLOCK_TIME_MS * n))
  if (durationMs === 0) return
  await new Promise<void>((resolve) => setTimeout(resolve, durationMs))
}

const sleep = async (ms: number) => {
  if (ms <= 0) return
  await new Promise<void>((resolve) => setTimeout(resolve, ms))
}

export class Blockchain {
  private readonly logAppender: BlockLogAppender
  private readonly indexerClient: IndexerRestClient
  private readonly chainId: ChainId

  public readonly stdMap: (topic: string) => StdMap
  public readonly stdTable: (topic: string) => StdTable
  public readonly getChainId: () => ChainId

  constructor(options: BlockchainOptions) {
    const { chainId, baseUrl, indexerBaseUrl } = options
    this.chainId = chainId
    this.logAppender = new BlockLogAppender(chainId, baseUrl)
    this.indexerClient = new IndexerRestClient({ baseUrl: indexerBaseUrl })
    this.getChainId = () => this.chainId
    this.stdMap = (topic: string) => {
      assertTopicFormat(topic)
      return new StdMap(topic, this, this.indexerClient)
    }
    this.stdTable = (topic: string) => {
      assertTopicFormat(topic)
      return new StdTable(topic, this, this.indexerClient)
    }
  }

  async append(log: TS_Log_Init<any>, options: AppendOptions = {}) {
    assertTopicFormat(log.topic)
    await this.logAppender.append([log])
    await waitBlock(options.waitForBlockTime ?? 1)
  }

  async appendBatch(logs: TS_Log_Init<any>[], options: AppendOptions = {}) {
    for (const log of logs) {
      assertTopicFormat(log.topic)
    }
    await this.logAppender.batchAppend(logs)
    await waitBlock(options.waitForBlockTime ?? 1)
  }

  async getCurrentBlockId(): Promise<number> {
    const info = await this.logAppender.getChainInfo()
    return info.latest_block_id
  }

  async *blocks(options: BlockStreamOptions = {}): AsyncGenerator<Block> {
    const pollIntervalMs = options.pollIntervalMs ?? 1_000
    let lastBlockId =
      options.startBlockId !== undefined ? options.startBlockId - 1 : undefined
    let lastLogCount = 0

    if (options.startBlockId === undefined) {
      const latest = await this.logAppender.getLatestBlock()
      lastBlockId = latest.id
      lastLogCount = latest.logs.length
      yield latest
    }

    while (true) {
      await sleep(pollIntervalMs)
      const latest = await this.logAppender.getLatestBlock()
      if (lastBlockId === undefined) {
        lastBlockId = latest.id
        lastLogCount = latest.logs.length
        yield latest
        continue
      }
      if (latest.id > lastBlockId) {
        const startId = Math.max(lastBlockId + 1, 0)
        for (let id = startId; id <= latest.id; id += 1) {
          const block =
            id === latest.id ? latest : await this.logAppender.getBlock(id)
          yield block
        }
        lastBlockId = latest.id
        lastLogCount = latest.logs.length
        continue
      }
      if (
        options.includePendingUpdates &&
        latest.id === lastBlockId &&
        latest.logs.length > lastLogCount
      ) {
        lastLogCount = latest.logs.length
        yield latest
      }
    }
  }

  async *logs(options: LogStreamOptions = {}): AsyncGenerator<TS_Log<any>> {
    let lastBlockId: number | null = null
    let lastLogCount = 0
    for await (const block of this.blocks({
      startBlockId: options.startBlockId,
      pollIntervalMs: options.pollIntervalMs,
      includePendingUpdates: true,
    })) {
      if (block.id !== lastBlockId) {
        lastBlockId = block.id
        lastLogCount = 0
      }
      for (let i = lastLogCount; i < block.logs.length; i += 1) {
        yield block.logs[i]
      }
      lastLogCount = block.logs.length
    }
  }
}
