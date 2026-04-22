import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, expect, vi } from "vitest"
import { App } from "./App"

const promptMock = vi.fn(async (request: { payload?: Record<string, unknown> }) => {
  const task = String(request.payload?.task ?? "")

  if (task === "summarize") {
    return {
      summary: "这是一个帮助用户澄清需求并生成文档的产品。",
      keyQuestions: ["问题一", "问题二", "问题三"],
    }
  }

  if (task === "generate_prd_lite") {
    return { prdLite: "# PRD-Lite\n\nremote prd" }
  }

  if (task === "generate_scenarios") {
    return { scenarios: "# Scenarios\n\nremote scenarios" }
  }

  if (task === "generate_decisions") {
    return { data: { decision: "# Decisions\n\nremote decisions" } }
  }

  if (task === "generate_delivery_plan") {
    return { data: { delivery_plan: "# Delivery Plan\n\nremote delivery plan" } }
  }

  throw new Error(`Unexpected task ${task}`)
})

const loginMock = vi.fn(async () => true)
const closeMock = vi.fn()
const authRedirectMock = vi.fn()
let mockAuthState: { token: string | null; login: () => void; loading: boolean } = {
  token: "web-auth-token",
  login: authRedirectMock,
  loading: false,
}

vi.mock("./pmateAuth", () => ({
  BlueprintAuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useBlueprintAuth: () => mockAuthState,
}))

vi.mock("@pmate/agent-sdk", () => ({
  AgentService: class {
    constructor(_: unknown) {}
  },
  AgentClient: class {
    constructor(_: unknown) {}

    async login(from: string, options?: { token?: string }) {
      return loginMock(from, options)
    }

    async prompt(request: { payload?: Record<string, unknown> }) {
      return promptMock(request)
    }

    close() {
      closeMock()
    }
  },
}))

function createStorage() {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    },
  }
}

describe("App", () => {
  beforeEach(() => {
    mockAuthState = {
      token: "web-auth-token",
      login: authRedirectMock,
      loading: false,
    }
    Object.defineProperty(window, "localStorage", {
      value: createStorage(),
      configurable: true,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    cleanup()
    promptMock.mockClear()
    loginMock.mockClear()
    closeMock.mockClear()
    authRedirectMock.mockClear()
  })

  it("blocks generation until required fields are filled, then generates confirmed input docs through the frontend agent", async () => {
    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText("关键字段录入")).toBeTruthy()
    })

    expect(screen.queryAllByText(/阶段 1/).length).toBeGreaterThan(0)
    expect(screen.queryAllByText(/阶段 2/).length).toBeGreaterThan(0)
    expect(screen.queryAllByText(/阶段 3/).length).toBeGreaterThan(0)
    expect(screen.queryByText("分析与建议")).toBeNull()
    expect(screen.queryByText("Review Docs")).toBeNull()
    expect(screen.queryByText("用户相关")).not.toBeNull()
    expect(screen.queryByText("使用场景")).not.toBeNull()
    expect(screen.queryByText("功能")).not.toBeNull()
    expect(screen.queryByText("输入输出")).toBeNull()
    expect(screen.queryByRole("button", { name: "新增自定义扩展" })).toBeNull()

    expect(screen.getByRole("button", { name: "提交" }).hasAttribute("disabled")).toBe(true)

    await user.type(screen.getByLabelText("产品名称"), "Blueprint Clarifier")
    await user.type(screen.getByLabelText("产品目标"), "把模糊需求转成可 review 文档")
    await user.type(screen.getByLabelText("背景"), "当前 proposal 输入经常只有一段模糊描述。")
    await user.type(screen.getByLabelText("技术栈"), "React{enter}TailwindCSS{enter}")
    await user.selectOptions(screen.getByLabelText("UI 风格"), "professional")

    const submitButton = screen.getByRole("button", { name: "提交" })
    expect(submitButton.hasAttribute("disabled")).toBe(false)

    await user.click(submitButton)

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith(
        expect.stringMatching(/^blueprint-web-/),
        expect.objectContaining({
          token: "web-auth-token",
        }),
      )
    })

    expect(screen.queryByText("前端已直连 agent，AI 摘要和关键问题已更新。")).not.toBeNull()
    expect(screen.queryByText("关键字段录入")).toBeNull()
    expect(screen.queryByText("分析与建议")).not.toBeNull()
    expect(screen.queryByText(/问题一/)).not.toBeNull()
    expect(screen.queryByText(/AI Draft 摘要/)).not.toBeNull()
    expect(screen.queryByText(/结构化输入建议/)).not.toBeNull()

    await user.click(screen.getByRole("button", { name: "确认进入文档生成" }))

    await user.click(screen.getByRole("button", { name: "生成 PRD-Lite" }))

    await waitFor(() => {
      expect(promptMock).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            task: "generate_prd_lite",
            docType: "prdLite",
          }),
        }),
      )
    })

    expect(screen.queryByRole("button", { name: "prd-lite.md" })).not.toBeNull()
    expect(screen.queryByText("分析与建议")).toBeNull()
    expect(screen.queryAllByText("Review Docs").length).toBeGreaterThan(0)
    expect(screen.queryByText(/remote prd/)).not.toBeNull()

    await user.click(screen.getByRole("button", { name: "生成 Decisions" }))

    await waitFor(() => {
      expect(promptMock).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            task: "generate_decisions",
            docType: "decisions",
          }),
        }),
      )
    })

    expect(screen.queryByRole("button", { name: "decisions.md" })).not.toBeNull()

    await user.click(screen.getByRole("button", { name: "生成 Delivery Plan" }))

    await waitFor(() => {
      expect(promptMock).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            task: "generate_delivery_plan",
            docType: "deliveryPlan",
          }),
        }),
      )
    })

    expect(screen.queryByRole("button", { name: "delivery-plan.md" })).not.toBeNull()
  })

  it("does not render the removed formal spec stage", async () => {
    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText("关键字段录入")).toBeTruthy()
    })

    await user.type(screen.getByLabelText("产品名称"), "Blueprint Clarifier")
    await user.type(screen.getByLabelText("产品目标"), "把模糊需求转成可 review 文档")
    await user.type(screen.getByLabelText("背景"), "当前 proposal 输入经常只有一段模糊描述。")
    await user.type(screen.getByLabelText("技术栈"), "React{enter}TailwindCSS{enter}")
    await user.selectOptions(screen.getByLabelText("UI 风格"), "professional")
    await user.click(screen.getByRole("button", { name: "提交" }))

    await waitFor(() => {
      expect(promptMock).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            task: "summarize",
          }),
        }),
      )
    })

    expect(screen.queryByRole("button", { name: "确认进入文档生成" })).not.toBeNull()
    expect(screen.queryByText(/阶段 4/)).toBeNull()
    expect(screen.queryByText("Formal Specs")).toBeNull()
    expect(screen.queryByRole("button", { name: "进入正式规格" })).toBeNull()
  })

  it("returns to stage 1 and opens suggested fields when补充信息 is requested", async () => {
    promptMock.mockImplementationOnce(async (request: { payload?: Record<string, unknown> }) => {
      const task = String(request.payload?.task ?? "")
      if (task !== "summarize") {
        throw new Error(`Unexpected task ${task}`)
      }

      return {
        summary: "信息还不完整，需要补充更多上下文。",
        keyQuestions: ["目标用户是谁？", "用户输入是什么？", "成功标准如何定义？"],
      }
    })

    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText("关键字段录入")).toBeTruthy()
    })

    await user.type(screen.getByLabelText("产品名称"), "Blueprint Clarifier")
    await user.type(screen.getByLabelText("产品目标"), "把模糊需求转成可 review 文档")
    await user.type(screen.getByLabelText("背景"), "当前 proposal 输入经常只有一段模糊描述。")
    await user.type(screen.getByLabelText("技术栈"), "React{enter}TailwindCSS{enter}")
    await user.selectOptions(screen.getByLabelText("UI 风格"), "professional")
    await user.click(screen.getByRole("button", { name: "提交" }))

    await waitFor(() => {
      expect(screen.getByText("结构化输入建议")).toBeTruthy()
    })

    await user.click(screen.getAllByRole("button", { name: "去补充" })[0]!)

    expect(screen.getByText("关键字段录入")).toBeTruthy()
    expect(screen.getByText("补充更多结构化信息")).toBeTruthy()
    expect(screen.getByLabelText("目标用户是谁")).toBeTruthy()
  })

  it("sends custom extension from output section to agent payload", async () => {
    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText("关键字段录入")).toBeTruthy()
    })

    await user.type(screen.getByLabelText("产品名称"), "Blueprint Clarifier")
    await user.type(screen.getByLabelText("产品目标"), "把模糊需求转成可 review 文档")
    await user.type(screen.getByLabelText("背景"), "当前 proposal 输入经常只有一段模糊描述。")
    await user.type(screen.getByLabelText("技术栈"), "React{enter}TailwindCSS{enter}")
    await user.selectOptions(screen.getByLabelText("UI 风格"), "professional")

    await user.click(screen.getByRole("button", { name: "展开更多字段" }))
    await user.click(screen.getByRole("button", { name: "展开更多字段" }))
    await user.click(screen.getByRole("button", { name: "展开更多字段" }))

    await user.click(screen.getByRole("button", { name: "新增自定义扩展" }))
    await user.type(screen.getByLabelText("扩展名称 1"), "客户渠道")
    await user.type(screen.getByLabelText("扩展内容 1"), "微信社群")

    await user.click(screen.getByRole("button", { name: "提交" }))

    await waitFor(() => {
      expect(promptMock).toHaveBeenCalled()
    })

    const summarizeCall = promptMock.mock.calls.find(
      ([request]) => request?.payload?.task === "summarize",
    )?.[0]
    const promptText = String(summarizeCall?.payload?.text ?? "")

    expect(promptText).toContain("自定义字段:")
    expect(promptText).toContain("客户渠道: 微信社群")
  })

  it("reveals optional sections in batches of three", async () => {
    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText("关键字段录入")).toBeTruthy()
    })

    expect(screen.queryByText("用户相关")).not.toBeNull()
    expect(screen.queryByText("使用场景")).not.toBeNull()
    expect(screen.queryByText("功能")).not.toBeNull()
    expect(screen.queryByText("输入输出")).toBeNull()

    await user.click(screen.getByRole("button", { name: "展开更多字段" }))

    expect(screen.queryByText("输入输出")).not.toBeNull()
    expect(screen.queryByText("约束")).not.toBeNull()
    expect(screen.queryByText("成功标准")).not.toBeNull()
    expect(screen.queryByText("风险")).toBeNull()
  })

  it("keeps other sections open when expanding another section", async () => {
    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText("关键字段录入")).toBeTruthy()
    })

    await user.click(screen.getByRole("button", { name: "展开用户相关" }))
    expect(screen.getByLabelText("目标用户是谁")).toBeTruthy()

    await user.click(screen.getByRole("button", { name: "展开使用场景" }))

    expect(screen.getByLabelText("目标用户是谁")).toBeTruthy()
    expect(screen.getByLabelText("使用场景")).toBeTruthy()
  })

  it("adds preset tech stack tags into the tech stack field", async () => {
    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText("关键字段录入")).toBeTruthy()
    })

    await user.click(screen.getByRole("button", { name: "添加 React" }))
    await user.click(screen.getByRole("button", { name: "添加 Vite" }))

    expect((screen.getByLabelText("技术栈") as HTMLInputElement).value).toBe("")
    expect(screen.getByRole("button", { name: "移除 React" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "移除 Vite" })).toBeTruthy()
  })

  it("adds custom tech stack on enter", async () => {
    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText("关键字段录入")).toBeTruthy()
    })

    await user.type(screen.getByLabelText("技术栈"), "Eslint{enter}")

    expect((screen.getByLabelText("技术栈") as HTMLInputElement).value).toBe("")
    expect(screen.getByRole("button", { name: "移除 Eslint" })).toBeTruthy()
  })

  it("shows a login call to action when account token is missing", async () => {
    mockAuthState = {
      token: null,
      login: authRedirectMock,
      loading: false,
    }

    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText("当前未登录 PMate")).toBeTruthy()
    })

    await user.click(screen.getByRole("button", { name: "去登录" }))

    expect(authRedirectMock).toHaveBeenCalled()
  })
})
