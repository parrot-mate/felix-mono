import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, vi } from "vitest"
import { App } from "./App"

describe("App", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("blocks generation until required fields are filled, then generates review docs", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
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

      return {
        ok: true,
        json: async () => ({
          ok: true,
          data: {
            docType: "prdLite",
            markdown: "# PRD-Lite\n\nremote prd",
          },
        }),
      }
    })
    vi.stubGlobal("fetch", fetchMock)

    const user = userEvent.setup()
    render(<App />)

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
        }),
      )
    })

    expect(screen.queryByText("评分、总结和分析问题已更新。")).not.toBeNull()
    expect(screen.queryByText(/问题一/)).not.toBeNull()
    expect(screen.queryByText("8 / 10")).not.toBeNull()

    const generateButton = screen.getByRole("button", { name: "生成 PRD-Lite" })
    await user.click(generateButton)

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
    expect(screen.queryByText(/# PRD-Lite/)).not.toBeNull()
  })
})
