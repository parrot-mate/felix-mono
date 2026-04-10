import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { App } from "./App"
import { BLUEPRINT_APP_ID } from "./auth"
import { BlueprintAuthProvider } from "./pmateAuth"

const TEST_AUTH_KEY = process.env.TEST_AUTH_KEY?.trim() ?? ""
const ENABLE_BLUEPRINT_AUTH_E2E = process.env.BLUEPRINT_AUTH_E2E === "1"
const AUTH_API_BASE = "https://auth-api-v2.pmate.chat"

const promptMock = vi.fn(async (request: { payload?: Record<string, unknown> }) => {
  const task = String(request.payload?.task ?? "")

  if (task === "summarize") {
    return {
      summary: "真实 auth 会话已经恢复，可以继续跑 Blueprint 主流程。",
      keyQuestions: ["问题一", "问题二", "问题三"],
    }
  }

  throw new Error(`Unexpected task ${task}`)
})

const loginMock = vi.fn(async () => true)
const closeMock = vi.fn()

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

async function postJson<T>(path: string, body: Record<string, unknown>) {
  const response = await fetch(`${AUTH_API_BASE}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-test": TEST_AUTH_KEY,
    },
    body: JSON.stringify(body),
  })
  const json = (await response.json()) as {
    success: boolean
    data?: T
    message?: string
  }

  if (!response.ok || !json.success || !json.data) {
    throw new Error(json.message ?? `Auth API request failed for ${path}`)
  }

  return json.data
}

async function seedTestAuthToken(app: string) {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1000)}`
  const mobile = `test_${suffix}`
  const issueResult = await postJson<{
    nonce: string
    issuedAt: string
  }>("/vcode", {
    mobile,
    purpose: "login",
  })

  const loginResult = await postJson<{
    token: string
  }>("/login", {
    body: {
      type: "sms",
      mobile,
      vcode: "888888",
    },
    nonce: issueResult.nonce,
    issuedAt: issueResult.issuedAt,
    app,
  })

  window.localStorage.setItem(`pmate-auth-token:${app}`, JSON.stringify(loginResult.token))
  return loginResult.token
}

const authDescribe = TEST_AUTH_KEY && ENABLE_BLUEPRINT_AUTH_E2E ? describe : describe.skip

authDescribe("App auth integration", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      value: createStorage(),
      configurable: true,
    })
  })

  afterEach(() => {
    cleanup()
    promptMock.mockClear()
    loginMock.mockClear()
    closeMock.mockClear()
    window.localStorage.clear()
  })

  it(
    "restores a real auth-api test session and completes the analysis submit flow",
    async () => {
      const expectedToken = await seedTestAuthToken(BLUEPRINT_APP_ID)
      const user = userEvent.setup()

      render(
        <BlueprintAuthProvider app={BLUEPRINT_APP_ID}>
          <App />
        </BlueprintAuthProvider>,
      )

      await waitFor(() => {
        expect(screen.queryByText("当前未登录 PMate")).toBeNull()
      })

      await user.type(screen.getByLabelText("产品名称"), "Blueprint Clarifier")
      await user.type(screen.getByLabelText("产品目标"), "把模糊需求转成可 review 文档")
      await user.type(screen.getByLabelText("背景"), "当前 proposal 输入经常只有一段模糊描述。")
      await user.type(screen.getByLabelText("技术栈"), "React\nTailwindCSS")
      await user.selectOptions(screen.getByLabelText("UI 风格"), "professional")
      await user.click(screen.getByRole("button", { name: "提交" }))

      await waitFor(() => {
        expect(loginMock).toHaveBeenCalledWith(
          expect.stringMatching(/^blueprint-web-/),
          expect.objectContaining({
            token: expectedToken,
          }),
        )
      })

      expect(screen.getByText("前端已直连 agent，AI 摘要和关键问题已更新。")).toBeTruthy()
      expect(screen.getByText("真实 auth 会话已经恢复，可以继续跑 Blueprint 主流程。")).toBeTruthy()
    },
    20_000,
  )
})
