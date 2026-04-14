import { AgentClient, AgentService } from "@pmate/agent-sdk"
import {
  categories,
  generatePrdLite,
  generateScenarios,
  type ExtraFieldsState,
  initialExtraFieldsState,
  type FormState,
} from "./clarifier"
import decisionsTemplate from "../../blueprint-api/prompts/generate-decisions.md?raw"
import deliveryPlanTemplate from "../../blueprint-api/prompts/generate-delivery-plan.md?raw"
import deploySpecTemplate from "../../blueprint-api/prompts/generate-deploy-spec.md?raw"
import developSpecTemplate from "../../blueprint-api/prompts/generate-develop-spec.md?raw"
import prdLiteTemplate from "../../blueprint-api/prompts/generate-prd-lite.md?raw"
import productSpecTemplate from "../../blueprint-api/prompts/generate-product-spec.md?raw"
import qaSpecTemplate from "../../blueprint-api/prompts/generate-qa-spec.md?raw"
import scenarioTemplate from "../../blueprint-api/prompts/generate-scenario.md?raw"

export type ReviewDocType = "prdLite" | "scenarios" | "decisions" | "deliveryPlan"
export type FormalSpecDocType = "product" | "develop" | "qa" | "deploy"

export type SummaryAgentResult = {
  summary: string
  keyQuestions: string[]
}

const DEFAULT_HUB_ENDPOINT = "wss://hub.pmate.chat"
const DEFAULT_AGENT_API_BASE_URL = "https://agent-api.pmate.chat"
const DEFAULT_BLUEPRINT_AGENT_ID = "blueprint:blueprint-summary"
const DEFAULT_PROMPT_TIMEOUT_MS = 60_000

const REVIEW_TASKS: Record<ReviewDocType, string> = {
  prdLite: "generate_prd_lite",
  scenarios: "generate_scenarios",
  decisions: "generate_decisions",
  deliveryPlan: "generate_delivery_plan",
}

const REVIEW_TEMPLATES: Record<ReviewDocType, string> = {
  prdLite: prdLiteTemplate,
  scenarios: scenarioTemplate,
  decisions: decisionsTemplate,
  deliveryPlan: deliveryPlanTemplate,
}

const REVIEW_RESPONSE_KEYS: Record<ReviewDocType, string[]> = {
  prdLite: ["prdLite", "prd_lite", "prd-lite"],
  scenarios: ["scenarios", "scenario"],
  decisions: ["decisions", "decision"],
  deliveryPlan: ["deliveryPlan", "delivery_plan", "delivery-plan"],
}

const FORMAL_SPEC_TASKS: Record<FormalSpecDocType, string> = {
  product: "generate_product_spec",
  develop: "generate_develop_spec",
  qa: "generate_qa_spec",
  deploy: "generate_deploy_spec",
}

const FORMAL_SPEC_TEMPLATES: Record<FormalSpecDocType, string> = {
  product: productSpecTemplate,
  develop: developSpecTemplate,
  qa: qaSpecTemplate,
  deploy: deploySpecTemplate,
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "")
}

function buildAgentConfig() {
  const hubBaseUrl = import.meta.env.VITE_HUB_ENDPOINT?.trim() || DEFAULT_HUB_ENDPOINT
  const agentApiBaseUrl =
    import.meta.env.VITE_AGENT_API_BASE_URL?.trim() || DEFAULT_AGENT_API_BASE_URL
  const agentId = import.meta.env.VITE_BLUEPRINT_AGENT_ID?.trim() || DEFAULT_BLUEPRINT_AGENT_ID

  return {
    hubBaseUrl,
    agentApiBaseUrl: trimTrailingSlash(agentApiBaseUrl),
    agentId,
  }
}

function unwrapAgentResponse(value: unknown) {
  if (!value || typeof value !== "object") {
    return value
  }

  const maybeEnvelope = value as { type?: unknown; content?: unknown }
  if (maybeEnvelope.type === "json" || maybeEnvelope.type === "text") {
    return maybeEnvelope.content
  }

  return value
}

function readStringField(payload: unknown, key: string) {
  if (!payload || typeof payload !== "object") {
    throw new Error(`Agent response is missing ${key}.`)
  }

  const value = (payload as Record<string, unknown>)[key]
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Agent response is missing ${key}.`)
  }

  return value.trim()
}

function readMarkdownField(payload: unknown, key: string) {
  if (typeof payload === "string" && payload.trim()) {
    return payload.trim()
  }

  if (!payload || typeof payload !== "object") {
    throw new Error(`Agent response is missing ${key}.`)
  }

  const value = (payload as Record<string, unknown>)[key]
  if (typeof value === "string" && value.trim()) {
    return value.trim()
  }

  const fallbackMarkdown = (payload as Record<string, unknown>).markdown
  if (typeof fallbackMarkdown === "string" && fallbackMarkdown.trim()) {
    return fallbackMarkdown.trim()
  }

  const fallbackContent = (payload as Record<string, unknown>).content
  if (typeof fallbackContent === "string" && fallbackContent.trim()) {
    return fallbackContent.trim()
  }

  throw new Error(`Agent response is missing ${key}.`)
}

function extractMarkdownFromRecord(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }

  const markdown = record.markdown
  if (typeof markdown === "string" && markdown.trim()) {
    return markdown.trim()
  }

  const content = record.content
  if (typeof content === "string" && content.trim()) {
    return content.trim()
  }

  const nonEmptyStrings = Object.values(record).filter(
    (value): value is string => typeof value === "string" && value.trim().length > 0,
  )
  if (nonEmptyStrings.length === 1) {
    return nonEmptyStrings[0].trim()
  }

  return null
}

function findMarkdownInNestedPayload(payload: unknown, keys: string[], visited = new WeakSet<object>()): string | null {
  if (!payload || typeof payload !== "object") {
    return null
  }

  if (visited.has(payload)) {
    return null
  }
  visited.add(payload)

  const record = payload as Record<string, unknown>
  const direct = extractMarkdownFromRecord(record, keys)
  if (direct) {
    return direct
  }

  for (const containerKey of ["data", "result", "response", "doc", "document", "payload", "output"]) {
    const nested = record[containerKey]
    const resolved = findMarkdownInNestedPayload(nested, keys, visited)
    if (resolved) {
      return resolved
    }
  }

  return null
}

function readMarkdownFieldWithAliases(payload: unknown, keys: string[]) {
  if (typeof payload === "string" && payload.trim()) {
    return payload.trim()
  }

  if (!payload || typeof payload !== "object") {
    throw new Error(`Agent response is missing ${keys[0] ?? "markdown"}.`)
  }

  const markdown = findMarkdownInNestedPayload(payload, keys)
  if (markdown) {
    return markdown
  }

  throw new Error(`Agent response is missing ${keys[0] ?? "markdown"}.`)
}

function readStringListField(payload: unknown, key: string) {
  if (!payload || typeof payload !== "object") {
    throw new Error(`Agent response is missing ${key}.`)
  }

  const value = (payload as Record<string, unknown>)[key]
  if (!Array.isArray(value)) {
    throw new Error(`Agent response is missing ${key}.`)
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
}

function toList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
}

function toExtraLines(extras: ExtraFieldsState[keyof ExtraFieldsState]) {
  return extras
    .filter((item) => item.label.trim() || item.value.trim())
    .map((item) => `${item.label.trim() || "未命名字段"}: ${item.value.trim() || "<待补充>"}`)
}

function listSection(title: string, items: string[]) {
  const rows = items.length > 0 ? items.map((item) => `- ${item}`) : ["- 待补充"]
  return [`## ${title}`, "", ...rows, ""].join("\n")
}

function resolveFallbackReason(error: unknown) {
  if (!(error instanceof Error)) {
    return "未知错误"
  }

  const message = error.message.trim()
  if (!message) {
    return "未知错误"
  }

  if (message.includes("未找到可用登录态")) {
    return "未登录（缺少可用 token）"
  }

  if (message.includes("timed out")) {
    return message
  }

  if (message.includes("missing")) {
    return `远端返回格式异常：${message}`
  }

  return message.replace(/\s+/g, " ")
}

function isTimeoutError(error: unknown) {
  return error instanceof Error && error.message.includes("timed out")
}

function fallbackNote(task: string, error: unknown) {
  const reason = resolveFallbackReason(error)
  return `> 注：远端 agent(${task}) 调用失败（${reason}），本次使用本地模板兜底。`
}

function generateDecisionsFallback(form: FormState, targetRepo: string) {
  const decisions = [
    `目标仓库: ${targetRepo || "pmate/blueprint"}`,
    `技术栈: ${form.techStack || "待确认"}`,
    `UI 风格: ${form.uiStyle || "待确认"}`,
  ]
  const assumptions = [
    ...toList(form.platformLimits).map((item) => `平台限制: ${item}`),
    ...toList(form.technicalLimits).map((item) => `技术限制: ${item}`),
    ...toList(form.uncertainties),
  ]

  return [
    "# Decisions",
    "",
    listSection("Core Decisions", decisions),
    listSection("Assumptions", assumptions),
  ].join("\n")
}

function generateDeliveryPlanFallback(form: FormState) {
  const milestones = [
    "第 1 天：补齐结构化输入 + 风险确认",
    "第 2-3 天：完成 Review Docs（PRD-Lite / Scenarios / Decisions / Delivery Plan）",
    "第 4-5 天：生成 Formal Specs 并做 QA 回归",
    "第 6 天：评审与修订",
  ]
  const risks = [...toList(form.failureRisks), ...toList(form.uncertainties)]

  return [
    "# Delivery Plan",
    "",
    listSection("Milestones", milestones),
    listSection("Risk Watchlist", risks),
  ].join("\n")
}

function generateProductSpecFallback(form: FormState) {
  return [
    "# product.md",
    "",
    listSection("Problem", [form.background || "待补充"]),
    listSection("Users", toList(form.targetUsers)),
    listSection("Goals", [form.productGoal || "待补充", ...toList(form.successDefinition)]),
  ].join("\n")
}

function generateDevelopSpecFallback(form: FormState, targetRepo: string) {
  return [
    "# develop.md",
    "",
    listSection("Repo and Stack", [`目标仓库: ${targetRepo || "pmate/blueprint"}`, form.techStack || "待补充"]),
    listSection("Scope", [...toList(form.mustHaveFeatures), ...toList(form.coreFeatures)]),
    listSection("Constraints", [...toList(form.platformLimits), ...toList(form.technicalLimits)]),
  ].join("\n")
}

function generateQaSpecFallback(form: FormState) {
  return [
    "# qa.md",
    "",
    listSection("Functional Cases", [
      "提交完整结构化输入后，可得到 Stage 2 分析结果",
      "四份 Review Docs 均可生成并可切换查看",
      "勾选 delivery-plan review 后，Formal Specs 可生成",
    ]),
    listSection("Validation Criteria", [...toList(form.successDefinition), ...toList(form.metrics)]),
  ].join("\n")
}

function generateDeploySpecFallback(form: FormState) {
  return [
    "# deploy.md",
    "",
    listSection("Deployment Approach", [
      "默认使用 pmate deploy",
      "上线前执行单元测试与页面回归",
      "保留回滚版本与配置快照",
    ]),
    listSection("Environment Assumptions", [form.platformLimits || "待补充", form.timeRequirements || "待补充"]),
  ].join("\n")
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string) {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`))
    }, timeoutMs)
  })

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer) clearTimeout(timer)
  })
}

export function estimateBlueprintScore(form: FormState) {
  const totalFields = categories.flatMap((category) => category.fields).length
  const filledFields = categories
    .flatMap((category) => category.fields)
    .filter((field) => form[field.id].trim().length > 0).length

  const score = Math.round((filledFields / Math.max(totalFields, 1)) * 10)
  return Math.min(10, Math.max(1, score))
}

export function buildBlueprintPromptText(
  form: FormState,
  targetRepo: string,
  extras: ExtraFieldsState = initialExtraFieldsState,
) {
  const lines: string[] = []

  for (const category of categories) {
    lines.push(`## ${category.title}`)
    for (const field of category.fields) {
      const value = form[field.id].trim()
      if (value) {
        lines.push(`${field.label}: ${value}`)
      }
    }
    const extraLines = toExtraLines(extras[category.id])
    if (extraLines.length > 0) {
      lines.push("自定义字段:")
      for (const item of extraLines) {
        lines.push(`- ${item}`)
      }
    }
    lines.push("")
  }

  if (targetRepo.trim()) {
    lines.push(`目标仓库: ${targetRepo.trim()}`)
  }

  return lines.join("\n").trim()
}

async function promptBlueprintAgent(token: string | null | undefined, payload: Record<string, unknown>) {
  if (!token) {
    throw new Error("未找到可用登录态，请先完成 PMate 登录。")
  }

  const { hubBaseUrl, agentApiBaseUrl, agentId } = buildAgentConfig()
  const agentService = new AgentService({
    agentApiBaseUrl,
    token,
    fetchImpl: (input, init) => fetch(input, init),
  })
  const client = new AgentClient({
    baseUrl: hubBaseUrl,
    agentService,
    timeoutMs: 60_000,
    streamTimeoutMs: 120_000,
    minChunkSizeBytes: 0,
  })

  const timeoutMs = Number(import.meta.env.VITE_BLUEPRINT_PROMPT_TIMEOUT_MS ?? DEFAULT_PROMPT_TIMEOUT_MS)
  const requestId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`

  try {
    await client.login(`blueprint-web-${Date.now()}`, { token })
    const maxAttempts = 2
    let lastError: unknown = null

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const response = await withTimeout(
          client.prompt<unknown>({
            agentId,
            payload: {
              ...payload,
              requestId: `${requestId}-attempt-${attempt}`,
              requestedAt: new Date().toISOString(),
            },
          }),
          timeoutMs,
          String(payload.task ?? "prompt"),
        )
        return unwrapAgentResponse(response)
      } catch (error) {
        lastError = error
        if (!isTimeoutError(error) || attempt >= maxAttempts) {
          throw error
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error("prompt failed after retry")
  } finally {
    client.close()
  }
}

function reviewFallback(
  form: FormState,
  extras: ExtraFieldsState,
  targetRepo: string,
  docType: ReviewDocType,
  task: string,
  error: unknown,
) {
  const doc =
    docType === "prdLite"
      ? generatePrdLite(form, extras)
      : docType === "scenarios"
        ? generateScenarios(form, extras)
        : docType === "decisions"
          ? generateDecisionsFallback(form, targetRepo)
          : generateDeliveryPlanFallback(form)

  return `${doc}\n\n${fallbackNote(task, error)}`
}

function formalFallback(
  form: FormState,
  targetRepo: string,
  docType: FormalSpecDocType,
  task: string,
  error: unknown,
) {
  const doc =
    docType === "product"
      ? generateProductSpecFallback(form)
      : docType === "develop"
        ? generateDevelopSpecFallback(form, targetRepo)
        : docType === "qa"
          ? generateQaSpecFallback(form)
          : generateDeploySpecFallback(form)

  return `${doc}\n\n${fallbackNote(task, error)}`
}

export async function summarizeBlueprint(
  form: FormState,
  targetRepo: string,
  token: string | null | undefined,
  extras: ExtraFieldsState = initialExtraFieldsState,
): Promise<SummaryAgentResult> {
  const response = await promptBlueprintAgent(token, {
    task: "summarize",
    docType: "proposal",
    text: buildBlueprintPromptText(form, targetRepo, extras),
    language: "zh",
    template: "",
  })

  return {
    summary: readStringField(response, "summary"),
    keyQuestions: readStringListField(response, "keyQuestions").slice(0, 3),
  }
}

export async function generateBlueprintReviewDoc(
  form: FormState,
  targetRepo: string,
  docType: ReviewDocType,
  token: string | null | undefined,
  extras: ExtraFieldsState = initialExtraFieldsState,
) {
  const task = REVIEW_TASKS[docType]
  let response: unknown = null

  try {
    response = await promptBlueprintAgent(token, {
      task,
      docType,
      text: buildBlueprintPromptText(form, targetRepo, extras),
      language: "zh",
      template: REVIEW_TEMPLATES[docType],
    })

    return readMarkdownFieldWithAliases(response, REVIEW_RESPONSE_KEYS[docType])
  } catch (error) {
    console.error("[blueprint-web] review doc generation fell back to local template", {
      task,
      docType,
      error: error instanceof Error ? error.message : String(error),
      response,
    })
    return reviewFallback(form, extras, targetRepo, docType, task, error)
  }
}

export async function generateBlueprintFormalSpec(
  form: FormState,
  targetRepo: string,
  docType: FormalSpecDocType,
  token: string | null | undefined,
  extras: ExtraFieldsState = initialExtraFieldsState,
) {
  const task = FORMAL_SPEC_TASKS[docType]

  try {
    const response = await promptBlueprintAgent(token, {
      task,
      docType,
      text: buildBlueprintPromptText(form, targetRepo, extras),
      language: "zh",
      template: FORMAL_SPEC_TEMPLATES[docType],
    })

    return readMarkdownField(response, docType)
  } catch (error) {
    return formalFallback(form, targetRepo, docType, task, error)
  }
}

export function assertFormalSpecReady(deliveryPlanReviewed: boolean) {
  if (!deliveryPlanReviewed) {
    throw new Error("Cannot generate formal specs. delivery-plan.md must be reviewed first.")
  }
}
