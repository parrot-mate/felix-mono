import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("node:module", async () => {
  const actual = await vi.importActual<typeof import("node:module")>("node:module")
  const mockedRequire = () => ({
    AgentClient: class {},
    AgentService: class {},
  })

  return {
    ...actual,
    createRequire: () => mockedRequire,
  }
})

import { buildAgentId, unwrapAgentResult } from "../src/lib/agentClient.js"
import { buildPromptText, generateProposalDoc, generateProposalDocs, scoreProposal, summarizeProposal } from "../src/lib/blueprintService.js"

const originalReadFileSync = vi.hoisted(() => vi.fn())

vi.mock("node:fs", async () => {
  const actual = await vi.importActual<typeof import("node:fs")>("node:fs")
  return {
    ...actual,
    readFileSync: originalReadFileSync,
  }
})

describe("agent adapter", () => {
  beforeEach(() => {
    originalReadFileSync.mockImplementation((filePath: string) => {
      if (filePath.endsWith("generate-prd-lite.md")) return "# PRD-Lite\n\nprd template"
      if (filePath.endsWith("generate-scenario.md")) return "# Scenarios\n\nscenario template"
      return ""
    })
  })

  it("builds namespace-prefixed agent id", () => {
    expect(buildAgentId("blueprint", "blueprint-summary")).toBe("blueprint:blueprint-summary")
  })

  it("unwraps envelope content", () => {
    const value = unwrapAgentResult<{ summary: string }>({
      type: "json",
      content: { summary: "ok" },
    })
    expect(value).toEqual({ summary: "ok" })
  })

  it("builds prompt text from required fields", () => {
    const text = buildPromptText({
      productName: "A",
      productGoal: "B",
      background: "C",
      techStack: "Web",
      uiStyle: "professional",
      language: "zh",
    })
    expect(text).toContain("产品名称: A")
    expect(text).toContain("产品目标: B")
    expect(text).toContain("背景: C")
    expect(text).toContain("技术栈: Web")
  })

  it("summarize returns score, short summary, and key questions", async () => {
    const client = {
      promptJsonDetailed: vi.fn().mockResolvedValue({
        agentId: "blueprint:blueprint-summary",
        payload: {
          task: "summarize",
          text: "产品名称: A",
          language: "zh",
          docType: "",
          template: "",
        },
        raw: {
          summary: "这是一个帮助用户把模糊需求整理成可评审方案的产品。",
          keyQuestions: ["功能是否收敛？", "商业价值是否足够强？", "技术落地是否可控？"],
        },
        unwrapped: {
          summary: "这是一个帮助用户把模糊需求整理成可评审方案的产品。",
          keyQuestions: ["功能是否收敛？", "商业价值是否足够强？", "技术落地是否可控？"],
        },
      }),
    } as any

    const result = await summarizeProposal(client, "blueprint-summary", {
      productName: "A",
      productGoal: "B",
      background: "C",
      techStack: "Web",
      uiStyle: "professional",
      language: "zh",
      targetUsers: "D",
    })

    expect(result.data.score).toBeGreaterThanOrEqual(1)
    expect(result.data.score).toBeLessThanOrEqual(10)
    expect(result.data.summary.length).toBeLessThanOrEqual(50)
    expect(result.data.keyQuestions).toHaveLength(3)
  })

  it("maps remote docs agent output to markdown docs", async () => {
    const client = {
      promptJsonDetailed: vi.fn().mockResolvedValue({
        agentId: "blueprint:blueprint-summary",
        payload: {
          task: "generate_docs",
          text: "产品名称: A",
          language: "zh",
          docType: "",
          template: "PRD-Lite template:\n# PRD-Lite\n\nprd template\n\nScenarios template:\n# Scenarios\n\nscenario template",
        },
        raw: {
          prdLite: "# PRD-Lite\n\ncontent",
          scenarios: "# Scenarios\n\ncontent",
        },
        unwrapped: {
          prdLite: "# PRD-Lite\n\ncontent",
          scenarios: "# Scenarios\n\ncontent",
        },
      }),
    } as any

    const docs = await generateProposalDocs(client, "blueprint-summary", {
      productName: "A",
      productGoal: "B",
      background: "C",
      techStack: "Web",
      uiStyle: "professional",
      language: "zh",
    })

    expect(client.promptJsonDetailed).toHaveBeenCalledWith("blueprint-summary", {
      task: "generate_docs",
      text: expect.stringContaining("产品名称: A"),
      language: "zh",
      docType: "",
      template: expect.stringContaining("PRD-Lite template:"),
    })
    expect(docs.data.prdLite).toContain("# PRD-Lite")
    expect(docs.data.scenarios).toContain("# Scenarios")
    expect(docs.debug.rawAgentResponse).toEqual({
      prdLite: "# PRD-Lite\n\ncontent",
      scenarios: "# Scenarios\n\ncontent",
    })
  })

  it("requests a single target document from the shared agent", async () => {
    const client = {
      promptJsonDetailed: vi.fn().mockResolvedValue({
        agentId: "blueprint:blueprint-summary",
        payload: {
          task: "generate_prd_lite",
          text: "产品名称: A",
          language: "zh",
          docType: "prdLite",
          template: "# PRD-Lite\n\nprd template",
        },
        raw: {
          prdLite: "# PRD-Lite\n\ncontent",
        },
        unwrapped: {
          prdLite: "# PRD-Lite\n\ncontent",
        },
      }),
    } as any

    const markdown = await generateProposalDoc(
      client,
      "blueprint-summary",
      {
        productName: "A",
        productGoal: "B",
        background: "C",
        techStack: "Web",
        uiStyle: "professional",
        language: "zh",
      },
      "prdLite",
    )

    expect(client.promptJsonDetailed).toHaveBeenCalledWith("blueprint-summary", {
      task: "generate_prd_lite",
      text: expect.stringContaining("产品名称: A"),
      language: "zh",
      docType: "prdLite",
      template: "# PRD-Lite\n\nprd template",
    })
    expect(markdown.data).toContain("# PRD-Lite")
  })

  it("falls back to local scenarios when remote generation returns empty", async () => {
    const client = {
      promptJsonDetailed: vi.fn().mockResolvedValue({
        agentId: "blueprint:blueprint-summary",
        payload: {
          task: "generate_scenarios",
          text: "产品名称: A",
          language: "zh",
          docType: "scenarios",
          template: "# Scenarios\n\nscenario template",
        },
        raw: {},
        unwrapped: {},
      }),
    } as any

    const markdown = await generateProposalDoc(
      client,
      "blueprint-summary",
      {
        productName: "A",
        productGoal: "B",
        background: "C",
        techStack: "Web",
        uiStyle: "professional",
        language: "zh",
        usageScenarios: "提交需求",
        userInputs: "产品描述",
        systemOutputs: "scenario 文档",
      },
      "scenarios",
    )

    expect(markdown.data).toContain("# Scenarios")
    expect(markdown.data).toContain("## Case 1: Happy Path")
    expect(markdown.debug.payload).toMatchObject({
      fallback: "local-scenarios-on-invalid-markdown",
    })
  })

  it("requests score via dedicated score task", async () => {
    const client = {
      promptJsonDetailed: vi.fn().mockResolvedValue({
        agentId: "blueprint:blueprint-summary",
        payload: {
          task: "summarize",
          text: "产品名称: A",
          language: "zh",
          docType: "",
          template: "",
        },
        raw: {
          summary: "简短总结",
          keyQuestions: ["问题一", "问题二", "问题三"],
        },
        unwrapped: {
          summary: "简短总结",
          keyQuestions: ["问题一", "问题二", "问题三"],
        },
      }),
    } as any

    const result = await scoreProposal(client, "blueprint-summary", {
      productName: "A",
      productGoal: "B",
      background: "C",
      techStack: "Web",
      uiStyle: "professional",
      language: "zh",
    })

    expect(client.promptJsonDetailed).toHaveBeenCalledWith("blueprint-summary", {
      task: "summarize",
      text: expect.stringContaining("产品名称: A"),
      language: "zh",
      docType: "",
      template: "",
    })
    expect(result.data.score).toBeGreaterThanOrEqual(1)
    expect(result.data.reason.length).toBeGreaterThan(0)
  })
})
