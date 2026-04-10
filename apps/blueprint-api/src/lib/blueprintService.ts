import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import type {
  AgentDebugInfo,
  BlueprintDocType,
  BlueprintFormalSpecDocType,
  GeneratedFormalSpecsResult,
  GeneratedDocsResult,
  ProposalExtraField,
  ProposalInput,
  ProposalScoreResult,
  SummaryResult,
} from "./types.js"
import { BlueprintAgentClient, BlueprintAgentError } from "./agentClient.js"

const optionalFieldLabels: Array<[keyof ProposalInput, string]> = [
  ["uiReferenceUrl", "可借鉴的网页链接"],
  ["targetUsers", "目标用户"],
  ["currentSolution", "当前解决方式"],
  ["userPain", "用户痛点"],
  ["usageScenarios", "使用场景"],
  ["usageFrequency", "使用频率"],
  ["timePressure", "时间压力"],
  ["coreFeatures", "核心功能"],
  ["mustHaveFeatures", "必须功能"],
  ["optionalFeatures", "可选功能"],
  ["userInputs", "用户输入"],
  ["systemOutputs", "系统输出"],
  ["outputFormat", "输出格式"],
  ["timeRequirements", "时间要求"],
  ["platformLimits", "平台限制"],
  ["technicalLimits", "技术限制"],
  ["successDefinition", "成功标准"],
  ["metrics", "指标"],
  ["uncertainties", "不确定点"],
  ["failureRisks", "失败风险"],
  ["externalData", "外部数据"],
  ["apiDependencies", "API 依赖"],
  ["usageMode", "使用模式"],
  ["workflowMode", "流程模式"],
  ["generateDocs", "是否生成文档"],
  ["exportNeeded", "是否需要导出"],
  ["editableNeeded", "是否需要可编辑"],
]

function filled(value: string | undefined) {
  return Boolean(value?.trim())
}

function formatExtras(extras: Record<string, ProposalExtraField[]> | undefined) {
  if (!extras) return []

  return Object.entries(extras)
    .flatMap(([categoryId, items]) =>
      items
        .filter((item) => filled(item.label) || filled(item.value))
        .map((item) => `自定义字段(${categoryId}): ${(item.label || "未命名字段").trim()}: ${(item.value || "<待补充>").trim()}`),
    )
}

export function buildPromptText(input: ProposalInput): string {
  const lines = [
    `产品名称: ${input.productName}`,
    `产品目标: ${input.productGoal}`,
    `背景: ${input.background}`,
    `技术栈: ${input.techStack}`,
    `UI 风格: ${input.uiStyle}`,
  ]

  for (const [field, label] of optionalFieldLabels) {
    const value = input[field]
    if (typeof value === "string" && filled(value)) {
      lines.push(`${label}: ${value}`)
    }
  }

  lines.push(...formatExtras(input.extras))

  return lines.join("\n")
}

type AgentBackedResult<T> = {
  data: T
  debug: AgentDebugInfo
}

const SCORE_BASELINE_FIELDS = 15
const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url))
const PROMPTS_DIR = path.resolve(CURRENT_DIR, "../../prompts")

function readPromptTemplate(fileName: string) {
  return readFileSync(path.join(PROMPTS_DIR, fileName), "utf8").trim()
}

function resolvePromptTemplate(docType: BlueprintDocType) {
  switch (docType) {
    case "prdLite":
      return readPromptTemplate("generate-prd-lite.md")
    case "scenarios":
      return readPromptTemplate("generate-scenario.md")
    case "decisions":
      return readPromptTemplate("generate-decisions.md")
    case "deliveryPlan":
      return readPromptTemplate("generate-delivery-plan.md")
  }
}

function resolveFormalSpecPromptTemplate(docType: BlueprintFormalSpecDocType) {
  switch (docType) {
    case "product":
      return readPromptTemplate("generate-product-spec.md")
    case "develop":
      return readPromptTemplate("generate-develop-spec.md")
    case "qa":
      return readPromptTemplate("generate-qa-spec.md")
    case "deploy":
      return readPromptTemplate("generate-deploy-spec.md")
  }
}

function resolveCombinedPromptTemplate() {
  return [
    "PRD-Lite template:",
    readPromptTemplate("generate-prd-lite.md"),
    "",
    "Scenarios template:",
    readPromptTemplate("generate-scenario.md"),
    "",
    "Decisions template:",
    readPromptTemplate("generate-decisions.md"),
    "",
    "Delivery plan template:",
    readPromptTemplate("generate-delivery-plan.md"),
  ].join("\n")
}

function resolveCombinedFormalSpecPromptTemplate() {
  return [
    "Product spec template:",
    readPromptTemplate("generate-product-spec.md"),
    "",
    "Develop spec template:",
    readPromptTemplate("generate-develop-spec.md"),
    "",
    "QA spec template:",
    readPromptTemplate("generate-qa-spec.md"),
    "",
    "Deploy spec template:",
    readPromptTemplate("generate-deploy-spec.md"),
  ].join("\n")
}

function splitLines(value: string | undefined) {
  return (value ?? "")
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function firstNonEmpty(items: Array<string | undefined>) {
  return items.find((item) => item != null && item.trim().length > 0)?.trim() ?? ""
}

function generateScenarioFallback(input: ProposalInput) {
  const scenarioSeed = firstNonEmpty([
    splitLines(input.usageScenarios)[0],
    splitLines(input.mustHaveFeatures)[0],
    splitLines(input.coreFeatures)[0],
    input.productGoal,
  ]) || "核心流程待补充"

  const userTrigger = firstNonEmpty([
    splitLines(input.userInputs)[0],
    input.targetUsers ? `${input.targetUsers} 发起任务` : "",
    `用户围绕“${scenarioSeed}”发起请求`,
  ])

  const expectedResult = firstNonEmpty([
    splitLines(input.systemOutputs)[0],
    input.productGoal,
    "系统输出可评审结果",
  ])

  const constraints = [
    ...splitLines(input.timeRequirements).map((item) => `时间要求：${item}`),
    ...splitLines(input.platformLimits).map((item) => `平台限制：${item}`),
    ...splitLines(input.technicalLimits).map((item) => `技术限制：${item}`),
  ]

  const edgeCondition = firstNonEmpty([
    splitLines(input.uncertainties)[0],
    splitLines(input.optionalFeatures)[0],
    constraints[0],
    "输入不完整但仍需给出可继续迭代的结果",
  ])

  const failureCondition = firstNonEmpty([
    splitLines(input.failureRisks)[0],
    splitLines(input.apiDependencies)[0],
    splitLines(input.externalData)[0],
    "关键依赖不可用或输入非法",
  ])

  return [
    "# Scenarios",
    "",
    "## Case 1: Happy Path",
    `- Description: 用户提供完成“${scenarioSeed}”所需的关键信息，系统顺利完成处理。`,
    `- Preconditions: ${userTrigger}；关键依赖可用；基础输入完整。`,
    "- Steps:",
    "  1. 用户填写必要输入并提交。",
    "  2. 系统校验输入并执行主流程。",
    "  3. 系统输出结果供用户查看、复制或继续编辑。",
    `- Expected Result: ${expectedResult}。`,
    "",
    "## Case 2: Edge Case",
    `- Description: 存在边界条件，系统仍需尽量产出可用结果。`,
    `- Preconditions: ${edgeCondition}。`,
    "- Steps:",
    "  1. 用户提交部分缺失、存在约束或含糊的输入。",
    "  2. 系统识别边界条件并保留 assumptions / open questions。",
    "  3. 系统返回可继续评审或补充的信息，而不是直接中断。",
    "- Expected Result: 系统输出带有明确假设、待确认项和后续建议的结果。",
    "",
    "## Case 3: Failure Case",
    `- Description: 关键依赖异常或输入不满足最低要求，主流程无法完成。`,
    `- Preconditions: ${failureCondition}。`,
    "- Steps:",
    "  1. 用户提交请求，或系统开始调用关键依赖。",
    "  2. 系统检测到失败条件并停止继续执行高风险步骤。",
    "  3. 系统返回可操作的失败说明和补救建议。",
    "- Expected Result: 系统明确说明失败原因、受影响范围以及建议的修复或重试方式。",
    "",
  ].join("\n")
}

function ensureMarkdownDoc(value: string | undefined, fallbackTitle: string): string {
  const trimmed = value?.trim()
  if (!trimmed) {
    throw new Error(`Remote docs agent returned empty ${fallbackTitle} content`)
  }
  return trimmed
}

function resolveDocTask(docType: BlueprintDocType) {
  switch (docType) {
    case "prdLite":
      return "generate_prd_lite"
    case "scenarios":
      return "generate_scenarios"
    case "decisions":
      return "generate_decisions"
    case "deliveryPlan":
      return "generate_delivery_plan"
  }
}

function resolveDocResponseKey(docType: BlueprintDocType): keyof GeneratedDocsResult {
  switch (docType) {
    case "prdLite":
      return "prdLite"
    case "scenarios":
      return "scenarios"
    case "decisions":
      return "decisions"
    case "deliveryPlan":
      return "deliveryPlan"
  }
}

export function assertDeliveryPlanReviewed(deliveryPlanReviewed: boolean, docType: BlueprintFormalSpecDocType) {
  if (!deliveryPlanReviewed) {
    throw new Error(`Cannot generate ${docType}. delivery-plan.md must be reviewed first.`)
  }
}

function resolveFormalSpecTask(docType: BlueprintFormalSpecDocType) {
  switch (docType) {
    case "product":
      return "generate_product_spec"
    case "develop":
      return "generate_develop_spec"
    case "qa":
      return "generate_qa_spec"
    case "deploy":
      return "generate_deploy_spec"
  }
}

function resolveFormalSpecResponseKey(docType: BlueprintFormalSpecDocType): keyof GeneratedFormalSpecsResult {
  return docType
}

function countFilledFields(input: ProposalInput) {
  const scalarFields = Object.entries(input).filter(([key, value]) => {
    if (key === "language" || key === "extras") return false
    return typeof value === "string" && value.trim().length > 0
  }).length

  const extraFields = Object.values(input.extras ?? {}).reduce((count, items) => {
    return count + items.filter((item) => item.label.trim() || item.value.trim()).length
  }, 0)

  return scalarFields + extraFields
}

function calculateCompletenessScore(input: ProposalInput) {
  const filledCount = countFilledFields(input)
  return Math.max(1, Math.min(10, Math.round((filledCount / SCORE_BASELINE_FIELDS) * 10)))
}

function buildScoreReason(score: number, filledCount: number) {
  if (score < 5) {
    return `当前仅录入约 ${filledCount} 项有效信息，误解空间较大，建议先补充场景、约束和输出预期。`
  }
  if (score < 7) {
    return `当前已录入约 ${filledCount} 项有效信息，主干可分析，但边界、商业和技术约束仍需继续补充。`
  }
  return `当前已录入约 ${filledCount} 项有效信息，需求主干较完整，可以进入更稳定的方案分析和文档生成。`
}

function buildLocalDebug(label: string, payload: Record<string, unknown>): AgentDebugInfo {
  return {
    agentId: `local:${label}`,
    payload,
    rawAgentResponse: null,
    unwrappedAgentResponse: null,
  }
}

function summarizeLocally(input: ProposalInput): SummaryResult {
  const score = calculateCompletenessScore(input)
  const questions = [
    !filled(input.targetUsers) ? "目标用户还不够明确，谁会在什么场景下持续使用？" : "",
    !filled(input.usageScenarios) ? "主要使用场景还缺少任务流描述，用户在什么时刻打开它？" : "",
    !filled(input.systemOutputs) ? "系统最终交付什么结果还不清楚，用户拿到的输出物是什么？" : "",
    !filled(input.successDefinition) ? "成功标准还未定义，怎样算这次交付有效？" : "",
  ].filter(Boolean).slice(0, 3)

  return {
    score,
    summary: `${input.productName} 旨在${input.productGoal}。当前基础信息已可支撑阶段化分析，后续文档将围绕 ${input.techStack} 和 ${input.uiStyle} 风格展开。`.slice(0, 50),
    keyQuestions: questions,
  }
}

function generatePrdLiteFallback(input: ProposalInput) {
  return [
    "# PRD-Lite",
    "",
    "## 产品概览",
    `- 产品名称：${input.productName}`,
    `- 产品目标：${input.productGoal}`,
    `- 背景：${input.background}`,
    `- 技术栈：${input.techStack}`,
    `- UI 风格：${input.uiStyle}`,
    "",
    "## 用户与场景",
    `- 目标用户：${firstNonEmpty([input.targetUsers, "待补充"])}`,
    `- 主要场景：${firstNonEmpty([input.usageScenarios, "待补充"])}`,
    `- 当前痛点：${firstNonEmpty([input.userPain, input.currentSolution, "待补充"])}`,
    "",
    "## 范围",
    `- 核心功能：${firstNonEmpty([input.coreFeatures, input.mustHaveFeatures, "待补充"])}`,
    `- 可选功能：${firstNonEmpty([input.optionalFeatures, "当前不纳入首版范围"])}`,
    "",
    "## 输入输出",
    `- 用户输入：${firstNonEmpty([input.userInputs, "待补充"])}`,
    `- 系统输出：${firstNonEmpty([input.systemOutputs, "待补充"])}`,
    "",
    "## 验收",
    `- 成功标准：${firstNonEmpty([input.successDefinition, buildScoreReason(calculateCompletenessScore(input), countFilledFields(input))])}`,
  ].join("\n")
}

function generateDecisionsFallback(input: ProposalInput) {
  return [
    "# Decisions",
    "",
    "## 高影响决策",
    `- 目标仓库：${firstNonEmpty([input.currentSolution, "pmate/felix-mono"])}`,
    `- 应用形态：${splitLines(input.techStack).some((item) => /react|vite/i.test(item)) ? "vite + node" : "待确认"}`,
    `- 首版必须能力：${firstNonEmpty([input.mustHaveFeatures, input.coreFeatures, "阶段化输入、分析、文档生成"])}`,
    `- 部署方向：${firstNonEmpty([input.platformLimits, "pmate deploy"])}`,
    "",
    "## 待确认",
    `- 外部依赖：${firstNonEmpty([input.apiDependencies, "暂无明确外部依赖"])}`,
    `- 风险点：${firstNonEmpty([input.uncertainties, input.failureRisks, "待补充"])}`,
  ].join("\n")
}

function generateDeliveryPlanFallback(input: ProposalInput) {
  return [
    "# Delivery Plan",
    "",
    "## 阶段 1：需求澄清与分析",
    "- 完成关键字段录入、评分、总结、关键问题确认。",
    "- 产出 prd-lite.md、scenarios.md、decisions.md、delivery-plan.md。",
    "",
    "## 阶段 2：实现设计",
    `- 基于 ${input.techStack} 明确前后端边界、状态流和 API contract。`,
    `- 收敛 UI 风格为 ${input.uiStyle}，补齐必要交互约束。`,
    "",
    "## 阶段 3：测试与发布",
    "- 完成 formal specs、回归测试和部署检查。",
    `- 验收标准：${firstNonEmpty([input.successDefinition, "关键流程可走通，文档可评审"])}`,
  ].join("\n")
}

function generateFormalSpecFallback(input: ProposalInput, docType: BlueprintFormalSpecDocType) {
  const common = [
    `- 产品名称：${input.productName}`,
    `- 产品目标：${input.productGoal}`,
    `- 背景：${input.background}`,
    `- 技术栈：${input.techStack}`,
  ]

  switch (docType) {
    case "product":
      return [
        "# product.md",
        "",
        "## 设计概览",
        ...common,
        `- 用户价值：${firstNonEmpty([input.targetUsers, "待补充"])} 在 ${firstNonEmpty([input.usageScenarios, "待补充"])} 下更快形成可执行文档。`,
        "",
        "## 范围与风险",
        `- 核心范围：${firstNonEmpty([input.coreFeatures, input.mustHaveFeatures, "待补充"])}`,
        `- 风险：${firstNonEmpty([input.uncertainties, input.failureRisks, "待补充"])}`,
      ].join("\n")
    case "develop":
      return [
        "# develop.md",
        "",
        "## 技术设计",
        ...common,
        "",
        "```mermaid",
        "flowchart TD",
        '  A["阶段 1 输入"] --> B["阶段 2 分析"]',
        '  B --> C["阶段 3 输入文档"]',
        '  C --> D["阶段 4 Formal Specs"]',
        "```",
        "",
        "## 开发计划",
        `- 前端：实现 staged flow 与文档分页。`,
        `- 后端：提供 summarize、markdown、formal spec 接口。`,
        `- 部署：优先使用 ${firstNonEmpty([input.platformLimits, "pmate deploy"])}。`,
      ].join("\n")
    case "qa":
      return [
        "# qa.md",
        "",
        "## 测试策略",
        "- 验证关键字段录入、分析阶段、文档生成、formal spec gate。",
        "",
        "#### Test Case / 测试用例: 用户可以完成分析并生成文档",
        `- Scenario / 场景: 用户填写 ${input.productName} 的关键字段后提交分析。`,
        "- Preconditions / 前置条件: 前后端服务可用。",
        "- Steps / 步骤:",
        "  1. 填写关键字段。",
        "  2. 提交分析。",
        "  3. 确认进入文档生成并生成 confirmed docs。",
        "- Expected Result / 预期结果: 系统返回评分、总结、关键问题，并成功生成文档。",
      ].join("\n")
    case "deploy":
      return [
        "# deploy.md",
        "",
        "## 部署计划",
        `- 应用形态：${splitLines(input.techStack).some((item) => /react|vite/i.test(item)) ? "vite + node" : "待确认"}`,
        `- 默认部署工具：${firstNonEmpty([input.platformLimits, "pmate deploy"])}`,
        "- 发布前检查：确认 delivery-plan 已 review，接口与前端构建通过。",
        "- 回滚策略：保留上一个稳定版本并回退到上一版构建产物。",
      ].join("\n")
  }
}

export function summarizeProposalLocally(input: ProposalInput): AgentBackedResult<SummaryResult> {
  return {
    data: summarizeLocally(input),
    debug: buildLocalDebug("summarize", {
      mode: "local-fallback",
      text: buildPromptText(input),
      language: input.language,
    }),
  }
}

export function generateProposalDocLocally(
  input: ProposalInput,
  docType: BlueprintDocType,
): AgentBackedResult<string> {
  const data =
    docType === "prdLite"
      ? generatePrdLiteFallback(input)
      : docType === "scenarios"
        ? generateScenarioFallback(input)
        : docType === "decisions"
          ? generateDecisionsFallback(input)
          : generateDeliveryPlanFallback(input)

  return {
    data,
    debug: buildLocalDebug(`generate-${docType}`, {
      mode: "local-fallback",
      docType,
      text: buildPromptText(input),
      language: input.language,
    }),
  }
}

export function generateFormalSpecLocally(
  input: ProposalInput,
  docType: BlueprintFormalSpecDocType,
  deliveryPlanReviewed: boolean,
): AgentBackedResult<string> {
  assertDeliveryPlanReviewed(deliveryPlanReviewed, docType)

  return {
    data: generateFormalSpecFallback(input, docType),
    debug: buildLocalDebug(`generate-formal-${docType}`, {
      mode: "local-fallback",
      docType,
      text: buildPromptText(input),
      language: input.language,
    }),
  }
}

export async function summarizeProposal(
  agentClient: BlueprintAgentClient,
  agentName: string,
  input: ProposalInput,
): Promise<AgentBackedResult<SummaryResult>> {
  const text = buildPromptText(input)
  const filledCount = countFilledFields(input)
  const score = calculateCompletenessScore(input)
  const result = await agentClient.promptJsonDetailed<Partial<SummaryResult>>(agentName, {
    task: "summarize",
    text,
    language: input.language,
    docType: "",
    template: "",
  })

  if (result.unwrapped == null) {
    throw new BlueprintAgentError("Empty response from llm-agent", {
      agentId: result.agentId,
      payload: result.payload,
      rawAgentResponse: result.raw,
      unwrappedAgentResponse: result.unwrapped,
    })
  }

  const response = result.unwrapped

  return {
    data: {
      score,
      summary: (response.summary ?? "").trim().slice(0, 50),
      keyQuestions: Array.isArray(response.keyQuestions)
        ? response.keyQuestions.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, 3)
        : [],
    },
    debug: {
      agentId: result.agentId,
      payload: result.payload,
      rawAgentResponse: result.raw,
      unwrappedAgentResponse: result.unwrapped,
    },
  }
}

export async function scoreProposal(
  agentClient: BlueprintAgentClient,
  agentName: string,
  input: ProposalInput,
): Promise<AgentBackedResult<ProposalScoreResult>> {
  const summary = await summarizeProposal(agentClient, agentName, input)
  const filledCount = countFilledFields(input)
  return {
    data: {
      score: summary.data.score,
      reason: buildScoreReason(summary.data.score, filledCount),
    },
    debug: summary.debug,
  }
}

export async function generateProposalDocs(
  agentClient: BlueprintAgentClient,
  agentName: string,
  input: ProposalInput,
): Promise<AgentBackedResult<GeneratedDocsResult>> {
  const text = buildPromptText(input)
  const result = await agentClient.promptJsonDetailed<Partial<GeneratedDocsResult>>(agentName, {
    task: "generate_docs",
    text,
    language: input.language,
    docType: "",
    template: resolveCombinedPromptTemplate(),
  })

  if (result.unwrapped == null) {
    throw new BlueprintAgentError("Empty response from llm-agent", {
      agentId: result.agentId,
      payload: result.payload,
      rawAgentResponse: result.raw,
      unwrappedAgentResponse: result.unwrapped,
    })
  }

  const response = result.unwrapped

  return {
    data: {
      prdLite: ensureMarkdownDoc(response.prdLite, "prdLite"),
      scenarios: ensureMarkdownDoc(response.scenarios, "scenarios"),
      decisions: ensureMarkdownDoc(response.decisions, "decisions"),
      deliveryPlan: ensureMarkdownDoc(response.deliveryPlan, "deliveryPlan"),
    },
    debug: {
      agentId: result.agentId,
      payload: result.payload,
      rawAgentResponse: result.raw,
      unwrappedAgentResponse: result.unwrapped,
    },
  }
}

export async function generateProposalDoc(
  agentClient: BlueprintAgentClient,
  agentName: string,
  input: ProposalInput,
  docType: BlueprintDocType,
): Promise<AgentBackedResult<string>> {
  const text = buildPromptText(input)
  let result: Awaited<ReturnType<typeof agentClient.promptJsonDetailed<Partial<GeneratedDocsResult>>>>

  try {
    result = await agentClient.promptJsonDetailed<Partial<GeneratedDocsResult>>(agentName, {
      task: resolveDocTask(docType),
      text,
      language: input.language,
      docType,
      template: resolvePromptTemplate(docType),
    })
  } catch (error) {
    if (docType === "scenarios") {
      return {
        data: generateScenarioFallback(input),
        debug: {
          agentId: `${agentClient.constructor.name}:${agentName}`,
          payload: {
            task: resolveDocTask(docType),
            text,
            language: input.language,
            docType,
            template: resolvePromptTemplate(docType),
            fallback: "local-scenarios-on-error",
            error: error instanceof Error ? error.message : String(error),
          },
          rawAgentResponse: null,
          unwrappedAgentResponse: null,
        },
      }
    }
    throw error
  }

  if (result.unwrapped == null) {
    if (docType === "scenarios") {
      return {
        data: generateScenarioFallback(input),
        debug: {
          agentId: result.agentId,
          payload: {
            ...result.payload,
            fallback: "local-scenarios-on-empty",
          },
          rawAgentResponse: result.raw,
          unwrappedAgentResponse: result.unwrapped,
        },
      }
    }
    throw new BlueprintAgentError("Empty response from llm-agent", {
      agentId: result.agentId,
      payload: result.payload,
      rawAgentResponse: result.raw,
      unwrappedAgentResponse: result.unwrapped,
    })
  }

  const response = result.unwrapped
  const responseKey = resolveDocResponseKey(docType)
  let markdown: string

  try {
    markdown = ensureMarkdownDoc(response[responseKey], responseKey)
  } catch (error) {
    if (docType === "scenarios") {
      return {
        data: generateScenarioFallback(input),
        debug: {
          agentId: result.agentId,
          payload: {
            ...result.payload,
            fallback: "local-scenarios-on-invalid-markdown",
            error: error instanceof Error ? error.message : String(error),
          },
          rawAgentResponse: result.raw,
          unwrappedAgentResponse: result.unwrapped,
        },
      }
    }
    throw error
  }

  return {
    data: markdown,
    debug: {
      agentId: result.agentId,
      payload: result.payload,
      rawAgentResponse: result.raw,
      unwrappedAgentResponse: result.unwrapped,
    },
  }
}

export async function generateFormalSpec(
  agentClient: BlueprintAgentClient,
  agentName: string,
  input: ProposalInput,
  docType: BlueprintFormalSpecDocType,
  deliveryPlanReviewed: boolean,
): Promise<AgentBackedResult<string>> {
  assertDeliveryPlanReviewed(deliveryPlanReviewed, docType)

  const text = buildPromptText(input)
  const result = await agentClient.promptJsonDetailed<Partial<GeneratedFormalSpecsResult>>(agentName, {
    task: resolveFormalSpecTask(docType),
    text,
    language: input.language,
    docType,
    template: resolveFormalSpecPromptTemplate(docType),
  })

  if (result.unwrapped == null) {
    throw new BlueprintAgentError("Empty response from llm-agent", {
      agentId: result.agentId,
      payload: result.payload,
      rawAgentResponse: result.raw,
      unwrappedAgentResponse: result.unwrapped,
    })
  }

  const response = result.unwrapped
  const responseKey = resolveFormalSpecResponseKey(docType)
  const markdown = ensureMarkdownDoc(response[responseKey], responseKey)

  return {
    data: markdown,
    debug: {
      agentId: result.agentId,
      payload: result.payload,
      rawAgentResponse: result.raw,
      unwrappedAgentResponse: result.unwrapped,
    },
  }
}

export async function generateFormalSpecs(
  agentClient: BlueprintAgentClient,
  agentName: string,
  input: ProposalInput,
  deliveryPlanReviewed: boolean,
): Promise<AgentBackedResult<GeneratedFormalSpecsResult>> {
  assertDeliveryPlanReviewed(deliveryPlanReviewed, "develop")

  const text = buildPromptText(input)
  const result = await agentClient.promptJsonDetailed<Partial<GeneratedFormalSpecsResult>>(agentName, {
    task: "generate_formal_specs",
    text,
    language: input.language,
    docType: "",
    template: resolveCombinedFormalSpecPromptTemplate(),
  })

  if (result.unwrapped == null) {
    throw new BlueprintAgentError("Empty response from llm-agent", {
      agentId: result.agentId,
      payload: result.payload,
      rawAgentResponse: result.raw,
      unwrappedAgentResponse: result.unwrapped,
    })
  }

  const response = result.unwrapped

  return {
    data: {
      product: ensureMarkdownDoc(response.product, "product"),
      develop: ensureMarkdownDoc(response.develop, "develop"),
      qa: ensureMarkdownDoc(response.qa, "qa"),
      deploy: ensureMarkdownDoc(response.deploy, "deploy"),
    },
    debug: {
      agentId: result.agentId,
      payload: result.payload,
      rawAgentResponse: result.raw,
      unwrappedAgentResponse: result.unwrapped,
    },
  }
}
