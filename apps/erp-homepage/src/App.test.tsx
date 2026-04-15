import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it } from "vitest"
import { App } from "./App"

function setLocation(path: string) {
  window.history.replaceState({}, "", path)
}

describe("App", () => {
  beforeEach(() => {
    window.localStorage?.removeItem("erp-homepage:navigation-items")
    window.localStorage?.removeItem("erp-homepage:preview-context")
    window.localStorage?.removeItem("erp-homepage:theme")
  })

  it("renders homepage in mock auth mode and hides unauthorized entries", async () => {
    setLocation("/?mockAuth=1&name=Nina&businessRole=employee&department=ops")
    render(<App />)

    expect(screen.getByText("Townhall Workspace")).toBeInTheDocument()
    expect(await screen.findByText("审批中心")).toBeInTheDocument()
    expect(screen.queryByText("销售 CRM")).not.toBeInTheDocument()
  })

  it("filters cards by search term", async () => {
    const user = userEvent.setup()
    setLocation("/?mockAuth=1&name=Nina&businessRole=employee&department=ops")
    render(<App />)

    await screen.findByText("审批中心")
    await user.type(screen.getByLabelText("Search"), "知识")

    expect(screen.getByText("知识库")).toBeInTheDocument()
    expect(screen.queryByText("审批中心")).not.toBeInTheDocument()
  })

  it("supports admin CRUD and persists new navigation items", async () => {
    const user = userEvent.setup()
    setLocation("/admin?mockAuth=1&name=May&businessRole=manager&department=sales")
    render(<App />)

    await screen.findByText("审批中心")
    await user.click(screen.getByRole("button", { name: "新增导航项" }))
    await user.type(screen.getByLabelText("名称"), "合同中心")
    await user.clear(screen.getByLabelText("分组"))
    await user.type(screen.getByLabelText("分组"), "业务系统")
    await user.type(screen.getByLabelText("描述"), "合同审批与模板下载。")
    await user.type(screen.getByLabelText("目标链接"), "https://contracts.example.com")
    await user.clear(screen.getByLabelText("图标缩写"))
    await user.type(screen.getByLabelText("图标缩写"), "CT")
    await user.type(screen.getByLabelText("可见角色"), "manager")
    await user.type(screen.getByLabelText("可见部门"), "sales")
    await user.click(screen.getByRole("button", { name: "保存" }))
    await screen.findByText("合同中心")

    await user.click(screen.getByRole("link", { name: "首页" }))

    expect(await screen.findByText("合同中心")).toBeInTheDocument()
  })

  it("toggles theme mode and persists selection", async () => {
    const user = userEvent.setup()
    setLocation("/?mockAuth=1&name=Nina&businessRole=employee&department=ops")
    render(<App />)

    const toggleButton = await screen.findByRole("button", { name: "切换白天模式" })
    await user.click(toggleButton)

    expect(window.localStorage.getItem("erp-homepage:theme")).toBe("light")
    expect(document.documentElement.dataset.theme).toBe("light")
    expect(screen.getByRole("button", { name: "切换黑夜模式" })).toBeInTheDocument()
  })
})
