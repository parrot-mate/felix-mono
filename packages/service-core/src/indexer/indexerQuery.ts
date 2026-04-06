import type { AclStatus, Entity, ThreadResponse } from "@pmate/meta"
import { IndexerRestClient, IndexerRestError } from "@pmate/blockchain"

const INDEXER_BASE_URL = process.env.INDEXER_BASE_URL
if (!INDEXER_BASE_URL) {
  throw new Error("INDEXER_BASE_URL is required")
}
const client = new IndexerRestClient({ baseUrl: INDEXER_BASE_URL })
export class IndexerQuery {
  public static async getMappedValue<T>(key: string) {
    try {
      const data = await client.request<T | null>("pmate", "mapping", "get", {
        query: {
          key,
        },
      })
      return data ?? undefined
    } catch (ex) {
      if (ex instanceof IndexerRestError && ex.status === 404) {
        return undefined
      }
      throw ex
    }
  }

  public static async entity<T>(entityId: string) {
    const data = await client.request<Entity<T>>("pmate", "account", "entity", {
      query: {
        id: entityId,
      },
    })
    return data
  }

  public static async entityExists<T>(entityId: string) {
    const data = await client.request<Entity<T>>("pmate", "account", "entity", {
      query: {
        id: entityId,
        exist_only: true,
      },
    })
    return data
  }

  public static async aclQuery(from: string, to: string): Promise<AclStatus> {
    const data = await client.request<AclStatus>("pmate", "acl", "status", {
      query: {
        from,
        to,
      },
    })
    return data
  }

  public static async aclQueryBatch(
    pairs: {
      from: string
      to: string
    }[]
  ): Promise<
    {
      from: string
      to: string
      status: AclStatus
    }[]
  > {
    const data = await client.request<
      {
        from: string
        to: string
        status: AclStatus
      }[]
    >("pmate", "acl", "status_batch", {
      query: {
        pairs,
      },
      method: "POST",
    })
    return data
  }

  public static async getAllowedList(user: string) {
    const data = await client.request<string[]>("pmate", "acl", "allow_list", {
      query: {
        user,
      },
    })
    return data
  }

  public static async entities<T>(ids: string[]) {
    if (!ids.length) {
      return []
    }
    const data = await client.request<Entity<T>[]>(
      "pmate",
      "account",
      "entities",
      {
        method: "POST",
        query: {
          ids,
        },
      }
    )
    return data
  }

  public static async profiles<T>(app: string, account: string) {
    const data = await client.request<Entity<T>[]>("pmate", "profile", "list", {
      query: {
        app,
        account,
      },
    })
    return data
  }

  public static async readmap(userId: string, hashs: string[]) {
    if (!hashs.length) {
      return []
    }
    const data = await client.request<number[]>(
      "pmate",
      "message_read",
      "readmap",
      {
        method: "POST",
        query: {
          user: userId,
          hashs,
        },
      }
    )
    return data
  }

  public static async readMsgList(userId: string) {
    const normalizedUserId = userId.trim()
    if (!normalizedUserId) {
      return []
    }
    const data = await client.request<string[]>(
      "pmate",
      "message_read",
      "list",
      {
        query: {
          user: normalizedUserId,
        },
      }
    )
    return data
  }

  public static async threads(userId: string) {
    const normalizedUserId = userId.trim()
    if (!normalizedUserId) {
      return []
    }
    const data = await client.request<ThreadResponse[]>(
      "pmate",
      "thread",
      "threads",
      {
        query: {
          user: normalizedUserId,
        },
      }
    )
    return data
  }

  public static async thread(userId: string, threadHash: string) {
    const normalizedUserId = userId.trim()
    const normalizedThreadHash = threadHash.trim()
    if (!normalizedUserId || !normalizedThreadHash) {
      return null
    }
    const data = await client.request<ThreadResponse | null>(
      "pmate",
      "thread",
      "thread",
      {
        query: {
          user: normalizedUserId,
          threadHash: normalizedThreadHash,
        },
      }
    )
    return data ?? null
  }
}
