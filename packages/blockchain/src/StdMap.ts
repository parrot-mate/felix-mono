import { buildMappingSetLog } from "./metaTypes"
import {
  IndexerRestError,
  type IndexerRestClient,
} from "./indexer/IndexerRestClient"
import type { Blockchain } from "./blockchain"
import { assertTopicFormat } from "./topic"

export class StdMap {
  constructor(
    private readonly topic: string,
    private readonly chain: Blockchain,
    private readonly indexerClient: IndexerRestClient
  ) {
    assertTopicFormat(topic)
  }

  async set<T>(key: string, value: T) {
    const storageKey = `${this.topic}:${key}`
    const log = buildMappingSetLog(this.topic, storageKey, value)
    await this.chain.append(log)
  }

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const storageKey = `${this.topic}:${key}`
      const data = await this.indexerClient.request<T | null>(
        this.chain.getChainId(),
        "mapping",
        "get",
        {
          query: {
            key: storageKey,
          },
        }
      )
      return data ?? undefined
    } catch (error) {
      if (error instanceof IndexerRestError && error.status === 404) {
        return undefined
      }
      throw error
    }
  }
}
