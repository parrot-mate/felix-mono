import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import type {
  AgentDebugInfo,
  BlueprintDocType,
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
  return docType === "prdLite"
    ? readPromptTemplate("generate-prd-lite.md")
    : readPromptTemplate("generate-scenario.md")
}

function resolveCombinedPromptTemplate() {
  return [
    "PRD-Lite template:",
    readPromptTemplate("generate-prd-lite.md"),
    "",
    "Scenarios template:",
    readPromptTemplate("generate-scenario.md"),
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
  return docType === "prdLite" ? "generate_prd_lite" : "generate_scenarios"
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
  let markdown: string

  try {
    markdown = docType === "prdLite"
      ? ensureMarkdownDoc(response.prdLite, "prdLite")
      : ensureMarkdownDoc(response.scenarios, "scenarios")
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
