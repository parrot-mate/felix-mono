import { defaultChainId, requestIndexer } from './indexerClient'

const ACCOUNT_INDEXER_NAME = 'account'

export interface EntityRecord {
  id: string
  [key: string]: unknown
}

export type EntityType = 'group' | 'account' | 'profile'

export interface EntityPageResponse {
  page: number
  totalPage: number
  pageSize: number
  data: EntityRecord[]
}

export async function fetchEntitiesPage(page?: number): Promise<EntityPageResponse | null> {
  const params =
    typeof page === 'number'
      ? {
          page,
        }
      : undefined

  try {
    const payload = await requestIndexer<unknown>(
      defaultChainId,
      ACCOUNT_INDEXER_NAME,
      'list',
      params,
    )
    if (!isEntityPageResponse(payload)) {
      throw new Error('invalid entity page payload')
    }
    return payload
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes('resource not found')) {
      return null
    }
    throw error
  }
}

function isEntityPageResponse(value: unknown): value is EntityPageResponse {
  if (!value || typeof value !== 'object') {
    return false
  }
  const record = value as Record<string, unknown>
  if (typeof record.page !== 'number') {
    return false
  }
  if (typeof record.totalPage !== 'number') {
    return false
  }
  if (typeof record.pageSize !== 'number') {
    return false
  }
  if (!Array.isArray(record.data)) {
    return false
  }
  return record.data.every(isEntityRecord)
}

function isEntityRecord(value: unknown): value is EntityRecord {
  if (!value || typeof value !== 'object') {
    return false
  }
  const record = value as Record<string, unknown>
  return typeof record.id === 'string' && record.id.length > 0
}
