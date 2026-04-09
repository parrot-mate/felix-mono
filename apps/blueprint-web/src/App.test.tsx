import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, expect, vi } from "vitest"
import { App } from "./App"
import { BLUEPRINT_APP_ID } from "./auth"

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
    Object.defineProperty(window, "localStorage", {
      value: createStorage(),
      configurable: true,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    cleanup()
    window.localStorage.clear()
  })

  it("blocks generation until required fields are filled, then generates confirmed input docs", async () => {
    window.localStorage.setItem(`pmate-auth-token:${BLUEPRINT_APP_ID}`, JSON.stringify("web-auth-token"))

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.endsWith("/api/blueprint/summarize")) {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            data: {
              score: 8,
              summary: "这是一个帮助用户澄清需求并生成文档的产品。",
              keyQuestions: ["问题一", "问题二", "问题三"],
            },
          }),
        }
      }

      if (url.endsWith("/api/blueprint/formal-spec/check")) {
        return {
          ok: false,
          json: async () => ({
            ok: false,
            error: "Cannot generate develop. delivery-plan.md must be reviewed first.",
          }),
        }
      }

      const body = typeof init?.body === "string" ? init.body : ""
      const parsedBody = body ? JSON.parse(body) : {}

      return {
        ok: true,
        json: async () => ({
          ok: true,
          data: {
            docType: parsedBody.docType,
            markdown:
              parsedBody.docType === "prdLite"
                ? "# PRD-Lite\n\nremote prd"
                : parsedBody.docType === "scenarios"
                  ? "# Scenarios\n\nremote scenarios"
                  : parsedBody.docType === "decisions"
                    ? "# Decisions\n\nremote decisions"
                    : "# Delivery Plan\n\nremote delivery plan",
          },
        }),
      }
    })
    vi.stubGlobal("fetch", fetchMock)

    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => {
      expect(screen.getAllByText("关键字段录入").length).toBeGreaterThan(0)
    })

    expect(screen.queryAllByText(/阶段 1/).length).toBeGreaterThan(0)
    expect(screen.queryAllByText(/阶段 2/).length).toBeGreaterThan(0)
    expect(screen.queryAllByText(/阶段 3/).length).toBeGreaterThan(0)
    expect(screen.queryAllByText(/阶段 4/).length).toBeGreaterThan(0)

    expect(screen.getByRole("button", { name: "提交" }).hasAttribute("disabled")).toBe(true)

    await user.type(screen.getByLabelText("产品名称"), "Blueprint Clarifier")
    await user.type(screen.getByLabelText("产品目标"), "把模糊需求转成可 review 文档")
    await user.type(screen.getByLabelText("背景"), "当前 proposal 输入经常只有一段模糊描述。")
    await user.type(screen.getByLabelText("技术栈"), "React\nTailwindCSS")
    await user.selectOptions(screen.getByLabelText("UI 风格"), "professional")

    const submitButton = screen.getByRole("button", { name: "提交" })
    expect(submitButton.hasAttribute("disabled")).toBe(false)

    await user.click(submitButton)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/blueprint\/summarize$/),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer web-auth-token",
          }),
        }),
      )
    })

    expect(screen.queryByText("评分、总结和分析问题已更新。")).not.toBeNull()
    expect(screen.queryByText(/问题一/)).not.toBeNull()
    expect(screen.queryByText("8 / 10")).not.toBeNull()
    expect(screen.queryByText(/这些内容由系统在阶段 2 自动推荐/)).not.toBeNull()
    expect(screen.queryByText(/建议补充的信息/)).not.toBeNull()
    expect(screen.queryByLabelText("目标仓库")).not.toBeNull()

    await user.click(screen.getByRole("button", { name: "确认进入文档生成" }))

    await user.click(screen.getByRole("button", { name: "生成 PRD-Lite" }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/blueprint\/markdown$/),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("\"docType\":\"prdLite\""),
        }),
      )
    })

    expect(screen.queryByRole("button", { name: "prd-lite.md" })).not.toBeNull()
    expect(screen.queryByText(/remote prd/)).not.toBeNull()

    await user.click(screen.getByRole("button", { name: "生成 Decisions" }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/blueprint\/markdown$/),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("\"docType\":\"decisions\""),
        }),
      )
    })

    expect(screen.queryByRole("button", { name: "decisions.md" })).not.toBeNull()

    await user.click(screen.getByRole("button", { name: "生成 Delivery Plan" }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/blueprint\/markdown$/),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("\"docType\":\"deliveryPlan\""),
        }),
      )
    })

    expect(screen.queryByRole("button", { name: "delivery-plan.md" })).not.toBeNull()
  })

  it("locks formal spec gate before confirmed input docs are ready", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.endsWith("/api/blueprint/formal-spec/check")) {
        return {
          ok: false,
          json: async () => ({
            ok: false,
            error: "Cannot generate develop. delivery-plan.md must be reviewed first.",
          }),
        }
      }

      if (url.endsWith("/api/blueprint/summarize")) {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            data: {
              score: 8,
              summary: "这是一个帮助用户澄清需求并生成文档的产品。",
              keyQuestions: ["问题一", "问题二", "问题三"],
            },
          }),
        }
      }

      return {
        ok: true,
        json: async () => ({
          ok: true,
          data: {
            docType: "deliveryPlan",
            markdown: "# Delivery Plan\n\nremote delivery plan",
          },
        }),
      }
    })
    vi.stubGlobal("fetch", fetchMock)

    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => {
      expect(screen.getAllByText("关键字段录入").length).toBeGreaterThan(0)
    })

    await user.type(screen.getByLabelText("产品名称"), "Blueprint Clarifier")
    await user.type(screen.getByLabelText("产品目标"), "把模糊需求转成可 review 文档")
    await user.type(screen.getByLabelText("背景"), "当前 proposal 输入经常只有一段模糊描述。")
    await user.type(screen.getByLabelText("技术栈"), "React\nTailwindCSS")
    await user.selectOptions(screen.getByLabelText("UI 风格"), "professional")
    await user.click(screen.getByRole("button", { name: "提交" }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/blueprint\/summarize$/),
        expect.objectContaining({
          method: "POST",
        }),
      )
    })

    expect(screen.queryByRole("button", { name: "确认进入文档生成" })).not.toBeNull()
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/blueprint\/formal-spec\/check$/),
      expect.anything(),
    )
    expect(screen.getByRole("button", { name: /阶段 4 正式规格/ }).hasAttribute("disabled")).toBe(true)
  })

  it("returns to stage 1 and opens suggested fields when补充信息 is requested", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.endsWith("/api/blueprint/summarize")) {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            data: {
              score: 6,
              summary: "信息还不完整，需要补充更多上下文。",
              keyQuestions: ["目标用户是谁？", "用户输入是什么？", "成功标准如何定义？"],
            },
          }),
        }
      }

      return {
        ok: true,
        json: async () => ({
          ok: true,
          data: {
            allowed: false,
          },
        }),
      }
    })
    vi.stubGlobal("fetch", fetchMock)

    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => {
      expect(screen.getAllByText("关键字段录入").length).toBeGreaterThan(0)
    })

    await user.type(screen.getByLabelText("产品名称"), "Blueprint Clarifier")
    await user.type(screen.getByLabelText("产品目标"), "把模糊需求转成可 review 文档")
    await user.type(screen.getByLabelText("背景"), "当前 proposal 输入经常只有一段模糊描述。")
    await user.type(screen.getByLabelText("技术栈"), "React\nTailwindCSS")
    await user.selectOptions(screen.getByLabelText("UI 风格"), "professional")
    await user.click(screen.getByRole("button", { name: "提交" }))

    await waitFor(() => {
      expect(screen.getByText("建议补充的信息")).toBeTruthy()
    })

    await user.click(screen.getAllByRole("button", { name: "去补充" })[0]!)

    expect(screen.getAllByText("关键字段录入").length).toBeGreaterThan(0)
    expect(screen.getByText("补充更多结构化信息")).toBeTruthy()
    expect(screen.getByLabelText("目标用户是谁")).toBeTruthy()
  })

  it("generates a formal spec after delivery plan review", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)

      if (url.endsWith("/api/blueprint/summarize")) {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            data: {
              score: 8,
              summary: "这是一个帮助用户澄清需求并生成文档的产品。",
              keyQuestions: ["问题一", "问题二", "问题三"],
            },
          }),
        }
      }

      if (url.endsWith("/api/blueprint/formal-spec/check")) {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            data: {
              allowed: true,
            },
          }),
        }
      }

      if (url.endsWith("/api/blueprint/formal-spec/markdown")) {
        const body = typeof init?.body === "string" ? JSON.parse(init.body) : {}
        return {
          ok: true,
          json: async () => ({
            ok: true,
            data: {
              docType: body.docType,
              markdown: "# Develop\n\nremote develop spec",
            },
          }),
        }
      }

      if (url.endsWith("/api/blueprint/markdown")) {
        const body = typeof init?.body === "string" ? JSON.parse(init.body) : {}
        return {
          ok: true,
          json: async () => ({
            ok: true,
            data: {
              docType: body.docType,
              markdown:
                body.docType === "prdLite"
                  ? "# PRD-Lite\n\nremote prd"
                  : body.docType === "scenarios"
                    ? "# Scenarios\n\nremote scenarios"
                    : body.docType === "decisions"
                      ? "# Decisions\n\nremote decisions"
                      : "# Delivery Plan\n\nremote delivery plan",
            },
          }),
        }
      }

      return {
        ok: true,
        json: async () => ({
          ok: true,
          data: {
            docType: "deliveryPlan",
            markdown: "# Delivery Plan\n\nremote delivery plan",
          },
        }),
      }
    })
    vi.stubGlobal("fetch", fetchMock)

    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => {
      expect(screen.getAllByText("关键字段录入").length).toBeGreaterThan(0)
    })

    await user.type(screen.getByLabelText("产品名称"), "Blueprint Clarifier")
    await user.type(screen.getByLabelText("产品目标"), "把模糊需求转成可 review 文档")
    await user.type(screen.getByLabelText("背景"), "当前 proposal 输入经常只有一段模糊描述。")
    await user.type(screen.getByLabelText("技术栈"), "React\nTailwindCSS")
    await user.selectOptions(screen.getByLabelText("UI 风格"), "professional")
    await user.click(screen.getByRole("button", { name: "提交" }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/blueprint\/summarize$/),
        expect.objectContaining({ method: "POST" }),
      )
    })

    await user.click(screen.getByRole("button", { name: "确认进入文档生成" }))
    await user.click(screen.getByRole("button", { name: "生成 PRD-Lite" }))
    await user.click(screen.getByRole("button", { name: "生成 Scenario" }))
    await user.click(screen.getByRole("button", { name: "生成 Decisions" }))
    await user.click(screen.getByRole("button", { name: "生成 Delivery Plan" }))

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "进入正式规格" }).hasAttribute("disabled")).toBe(false)
    })

    await user.click(screen.getByRole("button", { name: "进入正式规格" }))
    await user.click(screen.getByLabelText("已 review delivery-plan.md"))
    expect(screen.getByRole("button", { name: "生成 develop.md" }).hasAttribute("disabled")).toBe(false)
    await user.click(screen.getByRole("button", { name: "生成 develop.md" }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/blueprint\/formal-spec\/markdown$/),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("\"docType\":\"develop\""),
        }),
      )
    })

    expect(screen.queryByText(/remote develop spec/)).not.toBeNull()
  })
})
