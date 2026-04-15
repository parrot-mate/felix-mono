export type ProductOpenMode = "same-tab" | "new-tab"
export type ProductStatus = "active" | "beta" | "offline"

export interface ProductRecord {
  id: string
  name: string
  summary: string
  owner: string
  team?: string
  tags: string[]
  category: string
  status: ProductStatus
  entryUrl: string
  docUrl?: string
  icon?: string
  openMode: ProductOpenMode
  createdBy?: string
  updatedBy?: string
  createdAt: string
  updatedAt: string
}

export interface TownhallUiState {
  query: string
  selectedProductId: string | null
  category: string
  status: ProductStatus | "all"
  view: "home" | "manage"
}

export interface ProductFormInput {
  id?: string
  name: string
  summary: string
  owner: string
  team: string
  category: string
  tags: string
  status: ProductStatus
  entryUrl: string
  docUrl: string
  icon: string
  openMode: ProductOpenMode
}
