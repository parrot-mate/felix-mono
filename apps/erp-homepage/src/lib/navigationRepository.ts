import {
  blockchainConfig,
  navigationStore,
  navigationTableName,
} from "./blockchainClient"
import { defaultNavigationItems } from "../data/navigation"
import type { NavigationItem } from "../types"

export type NavigationInput = Omit<NavigationItem, "createdAt" | "updatedAt" | "createdBy" | "updatedBy">
export type NavigationPatch = Partial<NavigationItem> & { id: string }

export interface NavigationRepository {
  kind: "mock" | "blockchain"
  list(): Promise<NavigationItem[]>
  getById(id: string): Promise<NavigationItem | undefined>
  create(input: NavigationInput, actorId?: string): Promise<NavigationItem>
  update(input: NavigationPatch, actorId?: string): Promise<NavigationItem>
  delete(id: string): Promise<void>
  reset?(): Promise<void>
}

const storageKey = "erp-homepage:navigation-items"
const pendingStorageKey = "erp-homepage:blockchain-pending"
const table = navigationStore.table<NavigationItem>(navigationTableName)

type PendingState = {
  upserts: NavigationItem[]
  deletes: string[]
}

function sortItems(items: NavigationItem[]) {
  return [...items].sort((left, right) => {
    if (left.group !== right.group) {
      return left.group.localeCompare(right.group, "zh-CN")
    }
    return left.name.localeCompare(right.name, "zh-CN")
  })
}

function normalizeVisibility(item: NavigationItem): NavigationItem {
  const roles = item.visibility?.roles?.filter(Boolean) ?? []
  const departments = item.visibility?.departments?.filter(Boolean) ?? []

  return {
    ...item,
    visibility:
      roles.length || departments.length
        ? {
            roles,
            departments,
          }
        : undefined,
  }
}

function readLocalRows() {
  const raw = window.localStorage.getItem(storageKey)
  if (!raw) {
    return defaultNavigationItems
  }
  try {
    const parsed = JSON.parse(raw) as NavigationItem[]
    return Array.isArray(parsed) ? parsed : defaultNavigationItems
  } catch {
    return defaultNavigationItems
  }
}

function writeLocalRows(items: NavigationItem[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(items))
}

function readPendingState(): PendingState {
  if (typeof window === "undefined") {
    return { upserts: [], deletes: [] }
  }
  const raw = window.localStorage.getItem(pendingStorageKey)
  if (!raw) {
    return { upserts: [], deletes: [] }
  }
  try {
    const parsed = JSON.parse(raw) as PendingState
    return {
      upserts: Array.isArray(parsed?.upserts) ? parsed.upserts : [],
      deletes: Array.isArray(parsed?.deletes) ? parsed.deletes : [],
    }
  } catch {
    return { upserts: [], deletes: [] }
  }
}

function writePendingState(state: PendingState) {
  if (typeof window === "undefined") {
    return
  }
  window.localStorage.setItem(pendingStorageKey, JSON.stringify(state))
}

function rememberPendingUpsert(item: NavigationItem) {
  const state = readPendingState()
  writePendingState({
    upserts: [item, ...state.upserts.filter((entry) => entry.id !== item.id)],
    deletes: state.deletes.filter((entry) => entry !== item.id),
  })
}

function rememberPendingDelete(id: string) {
  const state = readPendingState()
  writePendingState({
    upserts: state.upserts.filter((entry) => entry.id !== id),
    deletes: [...new Set([id, ...state.deletes])],
  })
}

function reconcilePendingState(remoteItems: NavigationItem[]) {
  const state = readPendingState()
  const remoteById = new Map(remoteItems.map((item) => [item.id, item]))
  const nextUpserts = state.upserts.filter((pending) => {
    const remote = remoteById.get(pending.id)
    if (!remote) {
      return true
    }
    const pendingVersion = pending.updatedAt ?? pending.createdAt ?? 0
    const remoteVersion = remote.updatedAt ?? remote.createdAt ?? 0
    return remoteVersion < pendingVersion
  })
  const nextDeletes = state.deletes.filter((id) => remoteById.has(id))

  const merged = sortItems([
    ...remoteItems.filter((item) => !nextDeletes.includes(item.id)),
    ...nextUpserts.filter((item) => !nextDeletes.includes(item.id)),
  ].reduce<NavigationItem[]>((acc, item) => {
    if (acc.some((entry) => entry.id === item.id)) {
      return acc.map((entry) => (entry.id === item.id ? item : entry))
    }
    acc.push(item)
    return acc
  }, []))

  writePendingState({
    upserts: nextUpserts,
    deletes: nextDeletes,
  })

  return merged
}

export const mockNavigationRepository: NavigationRepository = {
  kind: "mock",
  async list() {
    return sortItems(readLocalRows())
  },
  async getById(id) {
    return readLocalRows().find((item) => item.id === id)
  },
  async create(input, actorId) {
    const now = Date.now()
    const next = normalizeVisibility({
      ...input,
      createdAt: now,
      updatedAt: now,
      createdBy: actorId,
      updatedBy: actorId,
    })
    const rows = [next, ...readLocalRows()]
    writeLocalRows(rows)
    return next
  },
  async update(input, actorId) {
    const rows = readLocalRows()
    const current = rows.find((item) => item.id === input.id)
    if (!current) {
      throw new Error(`Navigation item ${input.id} not found`)
    }
    const next = normalizeVisibility({
      ...current,
      ...input,
      updatedAt: Date.now(),
      updatedBy: actorId,
    })
    writeLocalRows(rows.map((item) => (item.id === input.id ? next : item)))
    return next
  },
  async delete(id) {
    writeLocalRows(readLocalRows().filter((item) => item.id !== id))
  },
  async reset() {
    writeLocalRows(defaultNavigationItems)
  },
}

function wrapRepositoryError(error: unknown, prefix: string) {
  if (error instanceof Error) {
    if (/load failed|failed to fetch|networkerror/i.test(error.message)) {
      return new Error(
        `${prefix}：当前 blockchain 服务不可达，请检查 VITE_BLOCKCHAIN_BASE_URL / VITE_INDEXER_BASE_URL 配置。`
      )
    }
    return error
  }
  return new Error(prefix)
}

export const blockchainNavigationRepository: NavigationRepository = {
  kind: "blockchain",
  async list() {
    try {
      return reconcilePendingState(await table.list(0))
    } catch (error) {
      if (error instanceof Error && /resource not found|404/i.test(error.message)) {
        return reconcilePendingState([])
      }
      throw wrapRepositoryError(error, "读取导航配置失败")
    }
  },
  async getById(id) {
    const state = readPendingState()
    const pendingUpsert = state.upserts.find((item) => item.id === id)
    if (pendingUpsert) {
      return pendingUpsert
    }
    if (state.deletes.includes(id)) {
      return undefined
    }
    try {
      const data = await table.getById(id)
      return data ?? undefined
    } catch (error) {
      if (error instanceof Error && /resource not found|404/i.test(error.message)) {
        return undefined
      }
      throw wrapRepositoryError(error, "读取导航配置失败")
    }
  },
  async create(input, actorId) {
    const now = Date.now()
    const row = normalizeVisibility({
      ...input,
      createdAt: now,
      updatedAt: now,
      createdBy: actorId,
      updatedBy: actorId,
    })
    try {
      await table.appendRow(row)
    } catch (error) {
      throw wrapRepositoryError(error, "写入导航配置失败")
    }
    rememberPendingUpsert(row)
    return row
  },
  async update(input, actorId) {
    const patch = normalizeVisibility({
      ...input,
      updatedAt: Date.now(),
      updatedBy: actorId,
    } as NavigationItem)
    try {
      await table.updateRow(patch)
    } catch (error) {
      throw wrapRepositoryError(error, "更新导航配置失败")
    }
    rememberPendingUpsert(patch)
    return patch
  },
  async delete(id) {
    try {
      await table.deleteRow(id)
    } catch (error) {
      throw wrapRepositoryError(error, "删除导航配置失败")
    }
    rememberPendingDelete(id)
  },
}

export function getNavigationRepository(mockMode: boolean) {
  return mockMode ? mockNavigationRepository : blockchainNavigationRepository
}
