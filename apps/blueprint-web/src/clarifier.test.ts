import { describe, expect, it } from "vitest"
import { buildClarificationReport, generateDocs, initialExtraFieldsState, initialFormState } from "./clarifier"

describe("clarifier rules", () => {
  it("flags missing required fields before generation", () => {
    const report = buildClarificationReport(initialFormState, initialExtraFieldsState)
    expect(report.requiredComplete).toBe(false)
    expect(report.requiredMissing).toContain("产品名称")
    expect(report.openQuestions.length).toBeGreaterThan(0)
  })

  it("generates prd-lite and scenarios with explicit unresolved sections", () => {
    const form = {
      ...initialFormState,
      productName: "结构化需求澄清器",
      productGoal: "帮助用户把模糊需求整理成可 review 文档",
      background: "团队在 proposal 前经常只拿到一段模糊描述。",
      techStack: "React\nTailwindCSS",
      uiStyle: "professional",
      targetUsers: "产品经理\n独立开发者",
      usageScenarios: "用户把初始想法填入页面\n用户补充边界后生成文档",
      coreFeatures: "分类字段输入\n文档生成",
      mustHaveFeatures: "必填字段校验\nAssumptions / Open Questions 保留",
      userInputs: "产品名称\n背景\n功能描述",
      systemOutputs: "prd-lite.md\nscenarios.md",
      successDefinition: "用户可以得到可 review 的初稿",
    }

    const docs = generateDocs(form, initialExtraFieldsState)
    expect(docs.prdLite).toContain("# PRD-Lite")
    expect(docs.prdLite).toContain("## Open questions")
    expect(docs.scenarios).toContain("# Scenarios")
    expect(docs.scenarios).toContain("## Scenario 1:")
  })
})

