import { Namespace } from "@pmate/store"
import type { ProductFormInput, ProductOpenMode, ProductRecord, ProductStatus, TownhallUiState } from "../types"

const STORAGE_KEY = "townhall-ui-state"
const CHAIN_ID = "pmate-test"
const BASE_URL = "https://qablk01.pmate.chat"
const INDEXER_BASE_URL = "https://qaidx.pmate.chat"
const NAMESPACE = "pmate"
const TABLE_NAME = "erp-homepage-nav"

type ProductTableRow = {
  id: string
  name: string
  description: string
  group: string
  url: string
  owner?: string
  team?: string
  tags?: string[]
  status?: ProductStatus
  docUrl?: string
  icon?: string
  openMode?: string
  createdAt?: number
  updatedAt?: number
  createdBy?: string
  updatedBy?: string
}

const DEFAULT_UI_STATE: TownhallUiState = {
  query: "",
  selectedProductId: null,
  category: "all",
  status: "all",
  view: "home",
}

function createTable() {
  return new Namespace({
    chain: CHAIN_ID,
    ns: NAMESPACE,
    baseUrl: BASE_URL,
    indexerBaseUrl: INDEXER_BASE_URL,
  }).table<ProductTableRow>(TABLE_NAME)
}

export async function listProducts(): Promise<ProductRecord[]> {
  const rows = await createTable().list()
  return rows.map(mapRowToProduct).sort(sortByUpdatedAtDesc)
}

export async function saveProduct(input: ProductRecord) {
  const table = createTable()
  const row = mapProductToRow(input)
  const exists = await table.exists(input.id)
  if (exists) {
    await table.updateRow(row)
    return
  }
  await table.appendRow(row)
}

export async function createProduct(input: ProductFormInput) {
  const now = Date.now()
  await saveProduct({
    id: `nav-${now.toString(36)}`,
    name: input.name.trim(),
    summary: input.summary.trim(),
    owner: input.owner.trim(),
    team: input.team.trim() || undefined,
    tags: input.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    category: input.category.trim(),
    status: input.status,
    entryUrl: input.entryUrl.trim(),
    docUrl: input.docUrl.trim() || undefined,
    icon: input.icon.trim() || undefined,
    openMode: input.openMode,
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
  })
}

export async function updateProduct(id: string, input: ProductFormInput) {
  const table = createTable()
  const existing = await table.getById(id)
  const now = Date.now()
  await saveProduct({
    id,
    name: input.name.trim(),
    summary: input.summary.trim(),
    owner: input.owner.trim(),
    team: input.team.trim() || undefined,
    tags: input.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    category: input.category.trim(),
    status: input.status,
    entryUrl: input.entryUrl.trim(),
    docUrl: input.docUrl.trim() || undefined,
    icon: input.icon.trim() || undefined,
    openMode: input.openMode,
    createdAt: toIso(existing?.createdAt, now),
    updatedAt: new Date(now).toISOString(),
    createdBy: existing?.createdBy,
    updatedBy: existing?.updatedBy,
  })
}

export async function deleteProduct(id: string) {
  await createTable().deleteRow(id)
  const ui = await loadUiState()
  if (ui.selectedProductId === id) {
    await saveUiState({
      ...ui,
      selectedProductId: null,
    })
  }
}

export async function loadUiState(): Promise<TownhallUiState> {
  if (typeof window === "undefined") {
    return DEFAULT_UI_STATE
  }
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return DEFAULT_UI_STATE
  }
  try {
    const parsed = JSON.parse(raw) as Partial<TownhallUiState>
    return { ...DEFAULT_UI_STATE, ...parsed }
  } catch {
    return DEFAULT_UI_STATE
  }
}

export async function saveUiState(input: TownhallUiState) {
  if (typeof window === "undefined") {
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(input))
}

function mapRowToProduct(row: ProductTableRow): ProductRecord {
  return {
    id: row.id,
    name: row.name,
    summary: row.description ?? "",
    owner: row.owner ?? formatOwner(row.createdBy),
    team: row.team ?? row.group ?? undefined,
    tags: Array.isArray(row.tags) ? row.tags : buildTagsFromLegacyRow(row),
    category: row.group ?? "未分类",
    status: row.status ?? inferStatus(row),
    entryUrl: row.url,
    docUrl: row.docUrl ?? row.url,
    icon: row.icon,
    openMode: normalizeOpenMode(row.openMode),
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  }
}

function mapProductToRow(product: ProductRecord): ProductTableRow {
  return {
    id: product.id,
    name: product.name,
    description: product.summary,
    group: product.category,
    url: product.entryUrl,
    owner: product.owner,
    team: product.team,
    tags: product.tags,
    status: product.status,
    docUrl: product.docUrl,
    icon: product.icon,
    openMode: normalizeOpenMode(product.openMode),
  }
}

function normalizeOpenMode(value?: string): ProductOpenMode {
  return value === "new-tab" ? "new-tab" : "same-tab"
}

function toIso(value?: number, fallback = Date.now()) {
  return new Date(typeof value === "number" ? value : fallback).toISOString()
}

function sortByUpdatedAtDesc(a: ProductRecord, b: ProductRecord) {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
}

function formatOwner(value?: string) {
  if (!value) {
    return "链上记录"
  }
  if (value.length <= 14) {
    return value
  }
  return `${value.slice(0, 6)}...${value.slice(-4)}`
}

function buildTagsFromLegacyRow(row: Pick<ProductTableRow, "icon" | "openMode" | "group">) {
  const tags = [row.icon, row.openMode === "new-tab" ? "new-tab" : "same-tab", row.group]
    .filter(Boolean)
    .map((item) => String(item))
  return Array.from(new Set(tags))
}

function inferStatus(row: Pick<ProductTableRow, "url">): ProductStatus {
  return row.url ? "active" : "offline"
}
