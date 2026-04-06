export type CategoryId =
  | "basics"
  | "users"
  | "usage"
  | "features"
  | "io"
  | "constraints"
  | "success"
  | "risks"
  | "data"
  | "interaction"
  | "output"

export type FieldId =
  | "productName"
  | "productGoal"
  | "background"
  | "techStack"
  | "uiStyle"
  | "uiReferenceUrl"
  | "targetUsers"
  | "currentSolution"
  | "userPain"
  | "usageScenarios"
  | "usageFrequency"
  | "timePressure"
  | "coreFeatures"
  | "mustHaveFeatures"
  | "optionalFeatures"
  | "userInputs"
  | "systemOutputs"
  | "outputFormat"
  | "timeRequirements"
  | "platformLimits"
  | "technicalLimits"
  | "successDefinition"
  | "metrics"
  | "uncertainties"
  | "failureRisks"
  | "externalData"
  | "apiDependencies"
  | "usageMode"
  | "workflowMode"
  | "generateDocs"
  | "exportNeeded"
  | "editableNeeded"

export type FormState = Record<FieldId, string>

export type ExtraField = {
  id: string
  label: string
  value: string
}

export type ExtraFieldsState = Record<CategoryId, ExtraField[]>

export type FieldConfig = {
  id: FieldId
  label: string
  kind: "text" | "textarea" | "select"
  required?: boolean
  placeholder?: string
  helper?: string
  options?: Array<{ value: string; label: string }>
}

export type CategoryConfig = {
  id: CategoryId
  title: string
  description: string
  fields: FieldConfig[]
  defaultOpen?: boolean
}

export type ClarificationReport = {
  requiredComplete: boolean
  requiredMissing: string[]
  suggestedCategories: string[]
  assumptions: string[]
  openQuestions: string[]
  completionRatio: number
}

export type GeneratedDocs = {
  prdLite: string
  scenarios: string
}

export const uiStyleOptions = [
  { value: "", label: "请选择 UI 风格" },
  { value: "editorial", label: "编辑感 / 信息密集" },
  { value: "minimal", label: "极简 / 冷静" },
  { value: "professional", label: "专业 / 工具型" },
  { value: "playful", label: "轻松 / 亲和" },
  { value: "bold", label: "强视觉 / 品牌感" },
  { value: "other", label: "其他 / 待补充" },
]

export const categories: CategoryConfig[] = [
  {
    id: "basics",
    title: "基础信息",
    description: "建立第一版需求轮廓，所有文档生成都以这里为起点。",
    defaultOpen: true,
    fields: [
      { id: "productName", label: "产品名称", kind: "text", required: true, placeholder: "例如：Blueprint Clarifier" },
      { id: "productGoal", label: "产品目标", kind: "text", required: true, placeholder: "一句话写清要解决什么问题" },
      { id: "background", label: "背景", kind: "textarea", required: true, placeholder: "为什么现在要做，当前问题是什么" },
      { id: "techStack", label: "技术栈", kind: "textarea", required: true, placeholder: "可自由文本，也可以按前端 / 后端 / 数据层换行填写" },
      { id: "uiStyle", label: "UI 风格", kind: "select", required: true, options: uiStyleOptions, helper: "当前选项是实现假设，可在 open questions 中继续确认。" },
      { id: "uiReferenceUrl", label: "可借鉴的网页链接", kind: "text", placeholder: "例如：https://example.com", helper: "填写一个你希望参考的页面链接，帮助 AI 理解视觉方向。" },
    ],
  },
  {
    id: "users",
    title: "用户相关",
    description: "澄清谁会使用、当前怎么解决、痛点是什么。",
    fields: [
      { id: "targetUsers", label: "目标用户是谁", kind: "textarea", placeholder: "一行一个用户群体" },
      { id: "currentSolution", label: "用户当前如何解决问题", kind: "textarea", placeholder: "已有替代方式、人工流程或竞品" },
      { id: "userPain", label: "用户痛点", kind: "textarea", placeholder: "一行一个痛点" },
    ],
  },
  {
    id: "usage",
    title: "使用场景",
    description: "优先按任务流补充场景，而不是按页面模块想功能。",
    fields: [
      { id: "usageScenarios", label: "使用场景", kind: "textarea", placeholder: "一行一个任务场景" },
      { id: "usageFrequency", label: "使用频率", kind: "text", placeholder: "例如：每天多次 / 每周一次" },
      { id: "timePressure", label: "是否有时间压力", kind: "text", placeholder: "例如：高，用户需要 30 秒内完成" },
    ],
  },
  {
    id: "features",
    title: "功能",
    description: "先写核心与必须项，再单独放可选项，避免范围失控。",
    fields: [
      { id: "coreFeatures", label: "核心功能", kind: "textarea", placeholder: "一行一个核心功能" },
      { id: "mustHaveFeatures", label: "必须功能", kind: "textarea", placeholder: "MVP 必须包含的能力，一行一个" },
      { id: "optionalFeatures", label: "可选功能", kind: "textarea", placeholder: "一行一个候选能力" },
    ],
  },
  {
    id: "io",
    title: "输入输出",
    description: "澄清用户输入什么，系统给出什么，以及结果长什么样。",
    fields: [
      { id: "userInputs", label: "用户输入", kind: "textarea", placeholder: "一行一个输入项" },
      { id: "systemOutputs", label: "系统输出", kind: "textarea", placeholder: "一行一个输出项" },
      { id: "outputFormat", label: "输出格式", kind: "text", placeholder: "例如：Markdown / 表格 / 卡片列表" },
    ],
  },
  {
    id: "constraints",
    title: "约束",
    description: "这里写清时间、平台和技术限制，避免后续实现偏航。",
    fields: [
      { id: "timeRequirements", label: "时间要求", kind: "text", placeholder: "例如：两周内可交付 MVP" },
      { id: "platformLimits", label: "平台限制", kind: "text", placeholder: "例如：仅桌面浏览器" },
      { id: "technicalLimits", label: "技术限制", kind: "textarea", placeholder: "例如：不接 OpenAI API / 必须纯前端" },
    ],
  },
  {
    id: "success",
    title: "成功标准",
    description: "只有写清成功标准，生成的 PRD-Lite 才能用于评审。",
    fields: [
      { id: "successDefinition", label: "如何判断成功", kind: "textarea", placeholder: "一行一个成功判断" },
      { id: "metrics", label: "是否有量化指标", kind: "textarea", placeholder: "一行一个指标；没有则留空" },
    ],
  },
  {
    id: "risks",
    title: "风险",
    description: "把不确定点和可能做错的地方先摊开。",
    fields: [
      { id: "uncertainties", label: "不确定点", kind: "textarea", placeholder: "一行一个不确定点" },
      { id: "failureRisks", label: "可能做错的地方", kind: "textarea", placeholder: "一行一个风险" },
    ],
  },
  {
    id: "data",
    title: "数据依赖",
    description: "如果依赖外部数据或 API，需要明确写出来。",
    fields: [
      { id: "externalData", label: "外部数据", kind: "textarea", placeholder: "一行一个外部数据来源" },
      { id: "apiDependencies", label: "API 依赖", kind: "textarea", placeholder: "一行一个 API 或系统依赖" },
    ],
  },
  {
    id: "interaction",
    title: "交互方式",
    description: "澄清这是一次性工具还是持续使用流程。",
    fields: [
      {
        id: "usageMode",
        label: "一次性 / 多次使用",
        kind: "select",
        options: [
          { value: "", label: "请选择" },
          { value: "one-off", label: "一次性" },
          { value: "repeat", label: "多次使用" },
          { value: "mixed", label: "两者都有" },
        ],
      },
      {
        id: "workflowMode",
        label: "工具型 / 流程型",
        kind: "select",
        options: [
          { value: "", label: "请选择" },
          { value: "tool", label: "工具型" },
          { value: "workflow", label: "流程型" },
          { value: "mixed", label: "两者都有" },
        ],
      },
    ],
  },
  {
    id: "output",
    title: "输出形式",
    description: "确认是否生成文档，是否导出，是否需要可编辑。",
    fields: [
      {
        id: "generateDocs",
        label: "是否生成文档",
        kind: "select",
        options: [
          { value: "", label: "请选择" },
          { value: "yes", label: "是" },
          { value: "no", label: "否" },
          { value: "unknown", label: "待确认" },
        ],
      },
      {
        id: "exportNeeded",
        label: "是否需要导出",
        kind: "select",
        options: [
          { value: "", label: "请选择" },
          { value: "yes", label: "是" },
          { value: "no", label: "否" },
          { value: "unknown", label: "待确认" },
        ],
      },
      {
        id: "editableNeeded",
        label: "是否需要可编辑",
        kind: "select",
        options: [
          { value: "", label: "请选择" },
          { value: "yes", label: "是" },
          { value: "no", label: "否" },
          { value: "unknown", label: "待确认" },
        ],
      },
    ],
  },
]

export const requiredFieldIds: FieldId[] = ["productName", "productGoal", "background", "techStack", "uiStyle"]

export const initialFormState: FormState = {
  productName: "",
  productGoal: "",
  background: "",
  techStack: "",
  uiStyle: "",
  uiReferenceUrl: "",
  targetUsers: "",
  currentSolution: "",
  userPain: "",
  usageScenarios: "",
  usageFrequency: "",
  timePressure: "",
  coreFeatures: "",
  mustHaveFeatures: "",
  optionalFeatures: "",
  userInputs: "",
  systemOutputs: "",
  outputFormat: "",
  timeRequirements: "",
  platformLimits: "",
  technicalLimits: "",
  successDefinition: "",
  metrics: "",
  uncertainties: "",
  failureRisks: "",
  externalData: "",
  apiDependencies: "",
  usageMode: "",
  workflowMode: "",
  generateDocs: "",
  exportNeeded: "",
  editableNeeded: "",
}

export const initialExtraFieldsState: ExtraFieldsState = {
  basics: [],
  users: [],
  usage: [],
  features: [],
  io: [],
  constraints: [],
  success: [],
  risks: [],
  data: [],
  interaction: [],
  output: [],
}

const categoryToPrompt: Record<CategoryId, string> = {
  basics: "基础信息仍有缺口，请先补齐核心目标与背景。",
  users: "建议补充目标用户、现有解决方式和痛点，避免需求只有功能没有使用上下文。",
  usage: "建议补充任务场景、频率和时间压力，便于按任务流生成 scenarios。",
  features: "建议明确核心功能、必须功能和可选功能，避免范围与优先级混淆。",
  io: "建议补充用户输入、系统输出和输出格式，避免文档只写目标不写结果。",
  constraints: "建议补充时间、平台和技术限制，避免实现边界不清。",
  success: "建议补充成功定义和指标，否则验收标准容易失焦。",
  risks: "建议先摊开不确定点和失败风险，帮助人工 review。",
  data: "如依赖外部数据或 API，应显式写出，避免实现阶段才暴露阻塞。",
  interaction: "建议补充使用方式和流程属性，帮助定义场景粒度。",
  output: "建议确认是否生成文档、是否导出、是否需要可编辑，避免输出形态不清。",
}

function filled(value: string) {
  return value.trim().length > 0
}

function lines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
}

function extraItems(items: ExtraField[]) {
  return items
    .filter((item) => filled(item.label) || filled(item.value))
    .map((item) => `${item.label || "未命名字段"}: ${item.value || "<待补充>"}`)
}

function listBlock(title: string, items: string[], emptyLine?: string) {
  const body = items.length ? items.map((item) => `- ${item}`).join("\n") : `- ${emptyLine ?? "open question: 待补充"}`
  return `## ${title}\n\n${body}`
}

function buildOpenQuestions(form: FormState, extras: ExtraFieldsState) {
  const questions: string[] = []
  if (!filled(form.targetUsers)) questions.push("open question: 目标用户尚未明确，需确认是谁会实际使用该产品。")
  if (!filled(form.usageScenarios)) questions.push("open question: 使用场景尚未明确，需补充任务流而不是页面清单。")
  if (!filled(form.userInputs)) questions.push("open question: 用户输入尚未明确，需确认系统实际接收什么信息。")
  if (!filled(form.systemOutputs)) questions.push("open question: 系统输出尚未明确，需确认最终交付给用户的结果。")
  if (!filled(form.successDefinition)) questions.push("open question: 成功标准尚未明确，需确认如何判断该产品有效。")
  if (!filled(form.generateDocs)) questions.push("open question: 输出形式尚未确认，需确认是否生成文档。")
  if (!filled(form.exportNeeded)) questions.push("open question: 是否需要导出尚未确认。")
  if (!filled(form.editableNeeded)) questions.push("open question: 输出是否需要可编辑尚未确认。")

  for (const [categoryId, items] of Object.entries(extras) as Array<[CategoryId, ExtraField[]]>) {
    items.forEach((item) => {
      if (filled(item.label) && !filled(item.value)) {
        questions.push(`open question: ${categories.find((category) => category.id === categoryId)?.title ?? categoryId}中的“${item.label}”尚未填写。`)
      }
    })
  }

  return Array.from(new Set(questions))
}

function buildAssumptions(form: FormState) {
  const assumptions = [
    "assumption: 当前文档仅基于已填写字段生成，未填写字段不视为已确认需求。",
  ]

  if (form.uiStyle === "other" || !filled(form.uiStyle)) {
    assumptions.push("assumption: UI 风格尚未完全收敛，当前仅按待补充处理，不延伸为具体视觉系统。")
  }
  if (!filled(form.platformLimits)) {
    assumptions.push("assumption: 平台限制未单独填写时，暂按技术栈与用户描述理解，不额外扩展平台范围。")
  }
  if (!filled(form.optionalFeatures)) {
    assumptions.push("assumption: 未单独列出的候选功能不默认进入当前版本范围。")
  }

  return Array.from(new Set(assumptions))
}

export function buildClarificationReport(form: FormState, extras: ExtraFieldsState): ClarificationReport {
  const requiredMissing = requiredFieldIds
    .filter((fieldId) => !filled(form[fieldId]))
    .map((fieldId) => categories.flatMap((category) => category.fields).find((field) => field.id === fieldId)?.label ?? fieldId)

  const suggestedCategories: string[] = []
  if (!filled(form.targetUsers) || !filled(form.currentSolution) || !filled(form.userPain)) suggestedCategories.push(categoryToPrompt.users)
  if (!filled(form.usageScenarios) || !filled(form.usageFrequency)) suggestedCategories.push(categoryToPrompt.usage)
  if (!filled(form.coreFeatures) || !filled(form.mustHaveFeatures)) suggestedCategories.push(categoryToPrompt.features)
  if (!filled(form.userInputs) || !filled(form.systemOutputs)) suggestedCategories.push(categoryToPrompt.io)
  if (!filled(form.successDefinition)) suggestedCategories.push(categoryToPrompt.success)
  if (!filled(form.technicalLimits) || !filled(form.platformLimits)) suggestedCategories.push(categoryToPrompt.constraints)
  if (!filled(form.uncertainties)) suggestedCategories.push(categoryToPrompt.risks)

  const allFields = categories.flatMap((category) => category.fields)
  const filledCount = allFields.filter((field) => filled(form[field.id])).length
  const completionRatio = Math.round((filledCount / allFields.length) * 100)

  return {
    requiredComplete: requiredMissing.length === 0,
    requiredMissing,
    suggestedCategories: Array.from(new Set(suggestedCategories)),
    assumptions: buildAssumptions(form),
    openQuestions: buildOpenQuestions(form, extras),
    completionRatio,
  }
}

function mergeCategoryList(formValue: string, extraValue: ExtraField[]) {
  return [...lines(formValue), ...extraItems(extraValue)]
}

function valueLabel(value: string, mapping: Record<string, string>) {
  return mapping[value] ?? value
}

export function generatePrdLite(form: FormState, extras: ExtraFieldsState) {
  const report = buildClarificationReport(form, extras)

  const goalItems = [
    `产品名称: ${form.productName}`,
    `产品目标: ${form.productGoal}`,
    `背景: ${form.background}`,
  ]

  const usersAndContext = [
    ...mergeCategoryList(form.targetUsers, extras.users),
    ...lines(form.currentSolution).map((item) => `当前解决方式: ${item}`),
    ...lines(form.userPain).map((item) => `用户痛点: ${item}`),
    ...lines(form.usageScenarios).map((item) => `使用场景: ${item}`),
    filled(form.usageFrequency) ? `使用频率: ${form.usageFrequency}` : "",
    filled(form.timePressure) ? `时间压力: ${form.timePressure}` : "",
  ].filter(Boolean)

  const inputsAndOutputs = [
    ...lines(form.userInputs).map((item) => `用户输入: ${item}`),
    ...lines(form.systemOutputs).map((item) => `系统输出: ${item}`),
    filled(form.outputFormat) ? `输出格式: ${form.outputFormat}` : "",
    filled(form.generateDocs) ? `是否生成文档: ${valueLabel(form.generateDocs, { yes: "是", no: "否", unknown: "待确认" })}` : "",
    filled(form.exportNeeded) ? `是否需要导出: ${valueLabel(form.exportNeeded, { yes: "是", no: "否", unknown: "待确认" })}` : "",
    filled(form.editableNeeded) ? `是否需要可编辑: ${valueLabel(form.editableNeeded, { yes: "是", no: "否", unknown: "待确认" })}` : "",
    ...extraItems(extras.io),
    ...extraItems(extras.output),
  ].filter(Boolean)

  const inScope = [
    ...mergeCategoryList(form.coreFeatures, extras.features),
    ...lines(form.mustHaveFeatures).map((item) => `必须功能: ${item}`),
  ]

  const outOfScope = [
    ...lines(form.optionalFeatures).map((item) => `候选功能，是否进入当前范围待确认: ${item}`),
  ]

  const constraints = [
    `技术栈: ${form.techStack}`,
    `UI 风格: ${valueLabel(form.uiStyle, {
      editorial: "编辑感 / 信息密集",
      minimal: "极简 / 冷静",
      professional: "专业 / 工具型",
      playful: "轻松 / 亲和",
      bold: "强视觉 / 品牌感",
      other: "其他 / 待补充",
    })}`,
    filled(form.timeRequirements) ? `时间要求: ${form.timeRequirements}` : "",
    filled(form.platformLimits) ? `平台限制: ${form.platformLimits}` : "",
    ...lines(form.technicalLimits).map((item) => `技术限制: ${item}`),
    ...extraItems(extras.constraints),
  ].filter(Boolean)

  const acceptance = [
    ...lines(form.successDefinition),
    ...lines(form.metrics).map((item) => `量化指标: ${item}`),
    ...extraItems(extras.success),
  ]

  return [
    "# PRD-Lite",
    "",
    listBlock("Goal", goalItems),
    "",
    listBlock("Users and context", usersAndContext, "open question: 用户与场景信息尚未充分补充。"),
    "",
    listBlock("Inputs and outputs", inputsAndOutputs, "open question: 输入输出尚未明确。"),
    "",
    listBlock("In scope", inScope, "open question: 核心功能和必须功能尚未明确。"),
    "",
    listBlock("Out of scope", outOfScope, "open question: 非范围内容尚未明确，需要人工确认哪些候选功能暂不进入当前版本。"),
    "",
    listBlock("Constraints", constraints, "open question: 时间、平台或技术约束尚未明确。"),
    "",
    listBlock("Acceptance criteria", acceptance, "open question: 尚未定义成功标准或量化指标。"),
    "",
    listBlock("Assumptions", report.assumptions),
    "",
    listBlock("Open questions", report.openQuestions),
    "",
  ].join("\n")
}

function buildScenarioBodies(form: FormState, extras: ExtraFieldsState) {
  const seeds = lines(form.usageScenarios).length
    ? lines(form.usageScenarios)
    : lines(form.mustHaveFeatures).length
      ? lines(form.mustHaveFeatures)
      : lines(form.coreFeatures).length
        ? lines(form.coreFeatures)
        : ["核心任务流程待补充"]

  const userInputs = lines(form.userInputs)
  const outputs = lines(form.systemOutputs)
  const risks = [...lines(form.failureRisks), ...lines(form.uncertainties), ...extraItems(extras.risks)]
  const decisionPoints = [
    ...lines(form.timeRequirements).map((item) => `时间要求: ${item}`),
    ...lines(form.platformLimits).map((item) => `平台限制: ${item}`),
    ...lines(form.technicalLimits).map((item) => `技术限制: ${item}`),
    filled(form.workflowMode) ? `交互方式: ${valueLabel(form.workflowMode, { tool: "工具型", workflow: "流程型", mixed: "两者都有" })}` : "",
    filled(form.usageMode) ? `使用模式: ${valueLabel(form.usageMode, { "one-off": "一次性", repeat: "多次使用", mixed: "两者都有" })}` : "",
  ].filter(Boolean)
  const featurePool = [...lines(form.mustHaveFeatures), ...lines(form.coreFeatures)]

  return seeds.map((seed, index) => {
    const feature = featurePool[index] ?? featurePool[0] ?? "open question: 需要补充对应的核心功能。"
    const humanPoints = [
      filled(form.editableNeeded)
        ? `根据输出形式，人工确认是否需要可编辑交付: ${valueLabel(form.editableNeeded, { yes: "是", no: "否", unknown: "待确认" })}`
        : "open question: 是否需要可编辑输出尚未确认。",
      "人工审核 assumptions 和 open questions，决定是否进入下一步 proposal 派生。",
    ]

    return [
      `## Scenario ${index + 1}: ${seed}`,
      "",
      `- Scenario title：${seed}`,
      `- User input or trigger：`,
      ...(userInputs.length ? userInputs.map((item) => `  - ${item}`) : ["  - open question: 用户触发条件尚未明确。"]),
      `- Expected outcome：`,
      ...(outputs.length ? outputs.map((item) => `  - ${item}`) : [`  - ${form.productGoal || "open question: 期望结果尚未明确。"} `]),
      `- High-level behavior：`,
      `  - 用户发起与“${seed}”相关的任务。`,
      `  - 系统接收必要输入并围绕“${feature}”组织处理。`,
      `  - 系统输出结果，供用户查看、导出或继续编辑。`,
      `- Key decision points：`,
      ...(decisionPoints.length ? decisionPoints.map((item) => `  - ${item}`) : ["  - open question: 关键决策点尚未明确。"]),
      `- Risks：`,
      ...(risks.length ? risks.map((item) => `  - ${item}`) : ["  - open question: 风险尚未明确。"]),
      `- Human intervention points：`,
      ...humanPoints.map((item) => `  - ${item}`),
      "",
    ].join("\n")
  })
}

export function generateScenarios(form: FormState, extras: ExtraFieldsState) {
  const report = buildClarificationReport(form, extras)
  const bodies = buildScenarioBodies(form, extras)

  return [
    "# Scenarios",
    "",
    ...bodies,
    "## Review Notes",
    "",
    ...report.openQuestions.map((item) => `- ${item}`),
    "",
  ].join("\n")
}

export function generateDocs(form: FormState, extras: ExtraFieldsState): GeneratedDocs {
  return {
    prdLite: generatePrdLite(form, extras),
    scenarios: generateScenarios(form, extras),
  }
}
