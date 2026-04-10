import { describe, expect, it, vi } from "vitest"
import {
  generateBlueprintFormalSpec,
  generateBlueprintReviewDoc,
  type FormalSpecDocType,
  type ReviewDocType,
} from "./blueprintAgent"
import { initialFormState, type FormState } from "./clarifier"

vi.mock("@pmate/agent-sdk", () => ({
  AgentService: class {
    constructor(_: unknown) {}
  },
  AgentClient: class {
    constructor(_: unknown) {}
    async login() {
      return true
    }
    async prompt() {
      throw new Error("mocked network failure")
    }
    close() {}
  },
}))

function buildForm(): FormState {
  return {
    ...initialFormState,
    productName: "Blueprint Clarifier",
    productGoal: "把模糊需求转成可 review 文档",
    background: "当前 proposal 输入经常只有一段模糊描述。",
    techStack: "React\nVite",
    uiStyle: "professional",
    successDefinition: "用户可以在 10 分钟内完成一轮需求澄清",
  }
}

describe("blueprintAgent fallbacks", () => {
  it.each<ReviewDocType>(["prdLite", "scenarios", "decisions", "deliveryPlan"])(
    "returns local fallback for review doc %s when token is missing",
    async (docType) => {
      const markdown = await generateBlueprintReviewDoc(buildForm(), "pmate/blueprint", docType, null)
      expect(markdown).toContain("本次使用本地模板兜底")
      expect(markdown.length).toBeGreaterThan(20)
    },
  )

  it.each<FormalSpecDocType>(["product", "develop", "qa", "deploy"])(
    "returns local fallback for formal spec %s when token is missing",
    async (docType) => {
      const markdown = await generateBlueprintFormalSpec(buildForm(), "pmate/blueprint", docType, null)
      expect(markdown).toContain("本次使用本地模板兜底")
      expect(markdown.length).toBeGreaterThan(20)
    },
  )
})
