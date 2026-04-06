import type { StdTableAppendInput, StdTableUpdateInput } from "./metaTypes"
import {
  buildStdTableCreateLog,
  buildStdTableDeleteLog,
  buildStdTableUpdateLog,
} from "./metaTypes"
import {
  IndexerRestError,
  type IndexerRestClient,
} from "./indexer/IndexerRestClient"
import type { Blockchain } from "./blockchain"
import { assertTopicFormat } from "./topic"

export class StdTable {
  constructor(
    private readonly topic: string,
    private readonly chain: Blockchain,
    private readonly indexerClient: IndexerRestClient
  ) {
    assertTopicFormat(topic)
  }

  async appendRow<T>(data: StdTableAppendInput<T>) {
    await this.chain.append(buildStdTableCreateLog(this.topic, data))
  }

  async updateRow<T>(data: StdTableUpdateInput<T>) {
    await this.chain.append(buildStdTableUpdateLog(this.topic, data))
  }

  async deleteRow(id: string) {
    await this.chain.append(buildStdTableDeleteLog(this.topic, id))
  }

  async list<T>(pageNo?: number): Promise<T[]> {
    let data:
      | { data?: T[] | null }
      | { data?: T[] | null; page?: number; pageSize?: number; totalPage?: number }
      | T[]
      | null
    try {
      data = await this.indexerClient.request<
        | { data?: T[] | null }
        | { data?: T[] | null; page?: number; pageSize?: number; totalPage?: number }
        | T[]
        | null
      >(
        this.chain.getChainId(),
        "table_indexer",
        "page",
        {
          query: {
            topic: this.topic,
            page_id: pageNo ?? 0,
          },
        }
      )
    } catch (error) {
      if (error instanceof IndexerRestError && error.status === 404) {
        return []
      }
      throw error
    }
    if (!data) return []
    if (Array.isArray(data)) return data
    if (typeof data === "object" && Array.isArray(data.data)) {
      return data.data
    }
    return []
  }

  async getById<T>(id: string): Promise<T | undefined> {
    try {
      const data = await this.indexerClient.request<T | null>(
        this.chain.getChainId(),
        "table_indexer",
        "get_by_id",
        {
          query: {
            topic: this.topic,
            id,
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

  async exists(id: string): Promise<boolean> {
    const data = await this.indexerClient.request<boolean>(
      this.chain.getChainId(),
      "table_indexer",
      "exists",
      {
        query: {
          topic: this.topic,
          id,
        },
      }
    )
    return Boolean(data)
  }

  async listTables(): Promise<string[]> {
    const data = await this.indexerClient.request<string[] | null>(
      this.chain.getChainId(),
      "table_indexer",
      "list"
    )
    return Array.isArray(data) ? data : []
  }
}
