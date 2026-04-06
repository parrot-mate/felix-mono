import { useCallback, useEffect, useState } from 'react'
import {
  fetchEntitiesPage,
  type EntityRecord,
  type EntityType,
} from '../api/accountIndexer'

const MAX_ENTITY_PAGES = 50_000 // safety guard to prevent unbounded fetch loops

export type CategorizedEntity = EntityRecord & { entityType: EntityType }

export function useEntities(enabled = true) {
  const [entities, setEntities] = useState<CategorizedEntity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const reload = useCallback(() => {
    setReloadToken((prev) => prev + 1)
  }, [])

  useEffect(() => {
    if (!enabled) {
      return
    }

    let cancelled = false

    async function loadEntities() {
      setLoading(true)
      setError(null)

      try {
        const page = await fetchEntitiesPage()
        if (!page) {
          if (!cancelled) {
            setEntities([])
          }
          return
        }

        const totalPages = page.totalPage
        const pages = new Map<number, EntityRecord[]>()
        pages.set(page.page, page.data)

        let current = page.page
        let iterations = 0
        while (current > 0 && iterations < MAX_ENTITY_PAGES) {
          const nextPageId = current - 1
          const nextPage = await fetchEntitiesPage(nextPageId)
          if (!nextPage) {
            break
          }
          pages.set(nextPage.page, nextPage.data)
          current = nextPage.page
          iterations += 1
        }

        const aggregated: EntityRecord[] = []
        for (let idx = 0; idx < totalPages; idx += 1) {
          const chunk = pages.get(idx)
          if (chunk) {
            aggregated.push(...chunk)
          }
        }

        if (!cancelled) {
          setEntities(aggregated.map((entity) => addEntityType(entity)))
        }
      } catch (err) {
        if (!cancelled) {
          setEntities([])
          setError(err instanceof Error ? err.message : 'Failed to load entities')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadEntities()
    return () => {
      cancelled = true
    }
  }, [enabled, reloadToken])

  useEffect(() => {
    if (!enabled) {
      setEntities([])
      setError(null)
      setLoading(false)
    }
  }, [enabled])

  return { entities, loading, error, reload }
}

function addEntityType(entity: EntityRecord): CategorizedEntity {
  return {
    ...entity,
    entityType: deriveEntityType(entity),
  }
}

function deriveEntityType(entity: EntityRecord): EntityType {
  if (hasField(entity, 'members')) {
    return 'group'
  }
  if (hasField(entity, 'profiles')) {
    return 'account'
  }
  return 'profile'
}

function hasField(entity: EntityRecord, key: string): boolean {
  const value = entity[key]
  if (Array.isArray(value)) {
    return value.length > 0
  }
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>).length > 0
  }
  return typeof value !== 'undefined' && value !== null
}
