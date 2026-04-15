export type BusinessRole =
  | "employee"
  | "manager"
  | "finance-admin"
  | "sales"
  | "hr-admin"

export type Department =
  | "ops"
  | "finance"
  | "sales"
  | "hr"
  | "procurement"

export type VisibilityRule = {
  roles?: BusinessRole[]
  departments?: Department[]
}

export type NavigationItem = {
  id: string
  name: string
  description: string
  url: string
  group: string
  icon: string
  openMode: "same-tab" | "new-tab"
  visibility?: VisibilityRule
  createdAt?: number
  updatedAt?: number
  createdBy?: string
  updatedBy?: string
}

export type ViewerContext = {
  name: string
  accountId?: string
  avatar?: string
  profileRole?: string
  businessRole: BusinessRole
  department: Department
  source: "mock" | "auth"
  authenticated: boolean
}
