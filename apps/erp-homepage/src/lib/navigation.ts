import type { BusinessRole, Department, NavigationItem, ViewerContext } from "../types"

export function filterNavigationItems(
  items: NavigationItem[],
  viewer: ViewerContext,
  searchTerm: string
) {
  const normalizedTerm = searchTerm.trim().toLowerCase()

  return items.filter((item) => {
    const roles = item.visibility?.roles
    const departments = item.visibility?.departments
    const roleAllowed =
      !roles || roles.length === 0 || roles.includes(viewer.businessRole)
    const departmentAllowed =
      !departments ||
      departments.length === 0 ||
      departments.includes(viewer.department)

    if (!roleAllowed || !departmentAllowed) {
      return false
    }

    if (!normalizedTerm) {
      return true
    }

    const haystack = `${item.name} ${item.description} ${item.group}`.toLowerCase()
    return haystack.includes(normalizedTerm)
  })
}

export function groupNavigationItems(items: NavigationItem[]) {
  const grouped = new Map<string, NavigationItem[]>()
  for (const item of items) {
    const current = grouped.get(item.group) ?? []
    current.push(item)
    grouped.set(item.group, current)
  }
  return [...grouped.entries()].map(([group, groupItems]) => ({
    group,
    items: groupItems,
  }))
}

export function parseCsvList<T extends string>(
  value: string,
  allowedValues: readonly T[]
) {
  const allowSet = new Set(allowedValues)
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item): item is T => Boolean(item) && allowSet.has(item as T))
}

export function serializeCsvList(values: string[] | undefined) {
  return values?.join(", ") ?? ""
}

export function createNavigationId(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return `${slug || "nav"}-${Date.now().toString(36)}`
}

export function readMockViewerContext(search: string): ViewerContext | null {
  const params = new URLSearchParams(search)
  if (params.get("mockAuth") !== "1") {
    return null
  }

  return {
    name: params.get("name") || "Mock User",
    accountId: params.get("accountId") || "mock-account",
    avatar: "",
    profileRole: params.get("profileRole") || "mate",
    businessRole: ((params.get("businessRole") || "employee") as BusinessRole),
    department: ((params.get("department") || "ops") as Department),
    source: "mock",
    authenticated: true,
  }
}
