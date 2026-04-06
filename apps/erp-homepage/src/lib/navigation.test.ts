import { describe, expect, it } from "vitest"
import { defaultNavigationItems } from "../data/navigation"
import type { ViewerContext } from "../types"
import {
  createNavigationId,
  filterNavigationItems,
  groupNavigationItems,
  parseCsvList,
  readMockViewerContext,
  serializeCsvList,
} from "./navigation"

const employeeViewer: ViewerContext = {
  name: "Nina",
  accountId: "acc-1",
  businessRole: "employee",
  department: "ops",
  source: "mock",
  authenticated: true,
}

describe("filterNavigationItems", () => {
  it("filters items by business role and department", () => {
    const employeeItems = filterNavigationItems(defaultNavigationItems, employeeViewer, "")
    const managerItems = filterNavigationItems(
      defaultNavigationItems,
      {
        ...employeeViewer,
        businessRole: "manager",
        department: "sales",
      },
      ""
    )

    expect(employeeItems.some((item) => item.id === "sales-crm")).toBe(false)
    expect(managerItems.some((item) => item.id === "sales-crm")).toBe(true)
  })

  it("matches search term across display text", () => {
    const items = filterNavigationItems(defaultNavigationItems, employeeViewer, "知识")
    expect(items).toHaveLength(1)
    expect(items[0]?.id).toBe("knowledge-base")
  })
})

describe("groupNavigationItems", () => {
  it("groups visible items by group name", () => {
    const groups = groupNavigationItems(
      filterNavigationItems(defaultNavigationItems, employeeViewer, "")
    )
    expect(groups.some((item) => item.group === "日常办公")).toBe(true)
  })
})

describe("csv helpers", () => {
  it("parses and serializes visibility lists", () => {
    const parsed = parseCsvList("employee, manager, unknown", [
      "employee",
      "manager",
      "finance-admin",
    ] as const)
    expect(parsed).toEqual(["employee", "manager"])
    expect(serializeCsvList(parsed)).toBe("employee, manager")
  })
})

describe("mock auth helper", () => {
  it("reads mock user context from query string", () => {
    expect(
      readMockViewerContext("?mockAuth=1&name=May&businessRole=manager&department=sales")
    ).toMatchObject({
      name: "May",
      businessRole: "manager",
      department: "sales",
      source: "mock",
    })
  })
})

describe("createNavigationId", () => {
  it("creates a stable slug prefix", () => {
    expect(createNavigationId("ERP Portal")).toMatch(/^erp-portal-/)
  })
})
