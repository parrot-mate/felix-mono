import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"
import { sampleProducts } from "./fixtures/sampleProducts"

const storeMocks = vi.hoisted(() => ({
  listProductsMock: vi.fn(),
  loadUiStateMock: vi.fn(),
  saveUiStateMock: vi.fn(),
  createProductMock: vi.fn(),
  updateProductMock: vi.fn(),
  deleteProductMock: vi.fn(),
}))

vi.mock("./pmateAuth", () => ({
  useTownhallAuth: () => ({
    loading: false,
    token: "token",
    login: vi.fn(),
    snapshot: {
      account: {
        accountName: "Codex User",
      },
    },
  }),
}))

vi.mock("./store/townhallStore", () => ({
  listProducts: storeMocks.listProductsMock,
  loadUiState: storeMocks.loadUiStateMock,
  saveUiState: storeMocks.saveUiStateMock,
  createProduct: storeMocks.createProductMock,
  updateProduct: storeMocks.updateProductMock,
  deleteProduct: storeMocks.deleteProductMock,
}))

import { App } from "./App"

describe("TownHall App", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    storeMocks.listProductsMock.mockResolvedValue(sampleProducts)
    storeMocks.loadUiStateMock.mockResolvedValue({
      query: "",
      selectedProductId: sampleProducts[0].id,
      category: "all",
      status: "all",
      view: "home",
    })
    storeMocks.saveUiStateMock.mockResolvedValue(undefined)
    storeMocks.createProductMock.mockResolvedValue(undefined)
    storeMocks.updateProductMock.mockResolvedValue(undefined)
    storeMocks.deleteProductMock.mockResolvedValue(undefined)
  })

  it("renders the homepage and detail panel with real-store data", async () => {
    render(<App />)

    expect(await screen.findByRole("heading", { level: 1, name: "TownHall" })).toBeInTheDocument()
    expect(screen.getByText(/统一收拢内部产品入口/)).toBeInTheDocument()
    expect(screen.getByLabelText("产品详情面板")).toBeInTheDocument()
  })

  it("filters products by search and updates the detail panel", async () => {
    const user = userEvent.setup()
    render(<App />)

    await screen.findByRole("heading", { level: 1, name: "TownHall" })
    await user.type(screen.getByLabelText("搜索"), "reader")
    await user.click(screen.getByRole("button", { name: /Reader/ }))

    const panel = screen.getByLabelText("产品详情面板")
    expect(within(panel).getByRole("heading", { level: 2, name: "Reader" })).toBeInTheDocument()
    expect(within(panel).getByText(/chunk 打包工作台/)).toBeInTheDocument()
  })

  it("creates a product from the management view", async () => {
    const user = userEvent.setup()
    storeMocks.listProductsMock
      .mockResolvedValueOnce(sampleProducts)
      .mockResolvedValueOnce([
        {
          id: "nav-agent-hub",
          name: "Agent Hub",
          summary: "统一管理 agent 注册、上下文与执行入口。",
          owner: "链上记录",
          team: "Workflow",
          tags: ["AH", "new-tab", "Workflow"],
          category: "Workflow",
          status: "active",
          entryUrl: "https://agenthub.pmate.chat/",
          docUrl: "https://agenthub.pmate.chat/",
          icon: "AH",
          openMode: "new-tab",
          createdAt: "2026-04-15T10:00:00.000Z",
          updatedAt: "2026-04-15T10:00:00.000Z",
        },
        ...sampleProducts,
      ])

    render(<App />)

    await screen.findByRole("heading", { level: 1, name: "TownHall" })
    await user.click(screen.getByRole("button", { name: "管理" }))

    await user.type(screen.getByLabelText("名称"), "Agent Hub")
    await user.type(screen.getByLabelText("负责人"), "AI Platform")
    await user.type(screen.getByLabelText("团队"), "Agent Infra")
    await user.type(screen.getByLabelText("分类"), "Workflow")
    await user.type(screen.getByLabelText("标签"), "agent, featured")
    await user.selectOptions(screen.getByLabelText("状态"), "beta")
    await user.type(screen.getByLabelText("图标"), "AH")
    await user.selectOptions(screen.getByLabelText("打开方式"), "new-tab")
    await user.type(screen.getByLabelText("简介"), "统一管理 agent 注册、上下文与执行入口。")
    await user.type(screen.getByLabelText("入口链接"), "https://agenthub.pmate.chat/")
    await user.type(screen.getByLabelText("文档链接"), "https://agenthub.pmate.chat/docs")

    await user.click(screen.getByRole("button", { name: "创建产品" }))

    await waitFor(() => {
      expect(storeMocks.createProductMock).toHaveBeenCalledWith({
        name: "Agent Hub",
        summary: "统一管理 agent 注册、上下文与执行入口。",
        owner: "AI Platform",
        team: "Agent Infra",
        category: "Workflow",
        tags: "agent, featured",
        status: "beta",
        entryUrl: "https://agenthub.pmate.chat/",
        docUrl: "https://agenthub.pmate.chat/docs",
        icon: "AH",
        openMode: "new-tab",
      })
    })
  })

  it("shows a validation error when a required field is missing", async () => {
    const user = userEvent.setup()
    render(<App />)

    await screen.findByRole("heading", { level: 1, name: "TownHall" })
    await user.click(screen.getByRole("button", { name: "管理" }))
    await user.click(screen.getByRole("button", { name: "创建产品" }))

    expect(screen.getByRole("alert")).toHaveTextContent("产品名称不能为空。")
  })
})
