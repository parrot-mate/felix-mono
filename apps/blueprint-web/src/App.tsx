import { useEffect, useMemo, useState } from "react"
import Markdown from "markdown-to-jsx"
import {
  BlueprintButton,
  BlueprintDocActionsModule,
  BlueprintField,
  BlueprintPanel,
  BlueprintStageCard,
  BlueprintSummaryModule,
} from "@felix/blueprint-ui"
import {
  type CategoryConfig,
  type CategoryId,
  type ExtraField,
  type ExtraFieldsState,
  type FieldId,
  buildClarificationReport,
  categories,
  initialExtraFieldsState,
  initialFormState,
} from "./clarifier"
import {
  estimateBlueprintScore,
  generateBlueprintReviewDoc,
  summarizeBlueprint,
  type ReviewDocType,
} from "./blueprintAgent"
import { useBlueprintAuth } from "./pmateAuth"

type StageId = "input" | "analysis" | "confirmedInputs"

type AiResult = {
  score: number
  summary: string
  keyQuestions: string[]
}

type RequestStatus =
  | { kind: "idle"; message: string }
  | { kind: "loading"; message: string }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string }

type MissingInfoSuggestion = {
  key: string
  categoryId: CategoryId
  title: string
  reason: string
}
const REVIEW_DOC_LABELS: Record<ReviewDocType, string> = {
  prdLite: "生成 PRD-Lite",
  scenarios: "生成 Scenario",
  decisions: "生成 Decisions",
  deliveryPlan: "生成 Delivery Plan",
}
const REVIEW_FILE_LABELS: Record<ReviewDocType, string> = {
  prdLite: "prd-lite.md",
  scenarios: "scenarios.md",
  decisions: "decisions.md",
  deliveryPlan: "delivery-plan.md",
}
const REVIEW_DOC_EXPLANATIONS: Array<{
  key: ReviewDocType
  title: string
  summary: string
}> = [
  {
    key: "prdLite",
    title: "PRD-Lite",
    summary: "用最短结构说明做什么、为谁做、为什么值得做，适合快速对齐需求方向。",
  },
  {
    key: "scenarios",
    title: "Scenario",
    summary: "把用户使用过程拆成关键场景和任务流，避免需求只剩页面清单。",
  },
  {
    key: "decisions",
    title: "Decisions",
    summary: "记录当前方案里的关键判断、约束和取舍，方便评审时快速理解为什么这样定。",
  },
  {
    key: "deliveryPlan",
    title: "Delivery Plan",
    summary: "说明交付范围、阶段拆分和落地顺序，帮助团队判断怎么开始做。",
  },
]
const TECH_STACK_PRESETS = ["React", "TailwindCSS", "Node", "Elysia", "Vite"] as const

function formatDisplayValue(value: unknown) {
  if (value == null) return ""
  if (typeof value === "string") return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function buildMissingInfoSuggestions(form: typeof initialFormState, requiredMissing: string[]) {
  const suggestions: MissingInfoSuggestion[] = []

  if (requiredMissing.length > 0) {
    suggestions.push({
      key: "required",
      categoryId: "basics",
      title: "先补齐关键字段",
      reason: `当前还缺少：${requiredMissing.join("、")}。这些字段会直接影响分析稳定性。`,
    })
  }

  if (!form.targetUsers.trim() || !form.currentSolution.trim() || !form.userPain.trim()) {
    suggestions.push({
      key: "users",
      categoryId: "users",
      title: "补充用户相关信息",
      reason: "目标用户、现有解决方式或痛点还不完整，系统容易只看到功能而看不到使用上下文。",
    })
  }

  if (!form.usageScenarios.trim() || !form.usageFrequency.trim()) {
    suggestions.push({
      key: "usage",
      categoryId: "usage",
      title: "补充使用场景",
      reason: "任务场景或使用频率不足，后续 scenarios 容易写成页面清单而不是任务流。",
    })
  }

  if (!form.coreFeatures.trim() || !form.mustHaveFeatures.trim()) {
    suggestions.push({
      key: "features",
      categoryId: "features",
      title: "补充功能边界",
      reason: "核心功能和必须功能还没有分清，范围容易继续发散。",
    })
  }

  if (!form.userInputs.trim() || !form.systemOutputs.trim()) {
    suggestions.push({
      key: "io",
      categoryId: "io",
      title: "补充输入输出",
      reason: "用户输入或系统输出还不清楚，文档会缺少交付结果定义。",
    })
  }

  if (!form.platformLimits.trim() || !form.technicalLimits.trim()) {
    suggestions.push({
      key: "constraints",
      categoryId: "constraints",
      title: "补充约束条件",
      reason: "平台或技术限制不完整，开发和部署建议会偏保守或不准确。",
    })
  }

  if (!form.successDefinition.trim()) {
    suggestions.push({
      key: "success",
      categoryId: "success",
      title: "补充成功标准",
      reason: "成功标准不清晰，PRD 和 QA 都容易失焦。",
    })
  }

  return suggestions
}

async function copyText(value: string) {
  await navigator.clipboard.writeText(value)
}

function downloadText(filename: string, value: string) {
  const blob = new Blob([value], { type: "text/markdown;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function App() {
  const optionalCategories = categories.filter((category) => category.id !== "basics")
  const { login, token: authToken } = useBlueprintAuth()
  const [form, setForm] = useState(initialFormState)
  const [extraFields, setExtraFields] = useState<ExtraFieldsState>(initialExtraFieldsState)
  const [stage, setStage] = useState<StageId>("input")
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<CategoryId[]>(["basics"])
  const [visibleOptionalBlockCount, setVisibleOptionalBlockCount] = useState(3)
  const [techStackDraft, setTechStackDraft] = useState("")
  const [pendingScrollCategoryId, setPendingScrollCategoryId] = useState<CategoryId | null>(null)
  const [aiResult, setAiResult] = useState<AiResult | null>(null)
  const [requestStatus, setRequestStatus] = useState<RequestStatus>({
    kind: "idle",
    message: "等待提交表单后开始分析。",
  })
  const [targetRepo, setTargetRepo] = useState("pmate/blueprint")
  const [reviewDocs, setReviewDocs] = useState<Record<ReviewDocType, string>>({
    prdLite: "",
    scenarios: "",
    decisions: "",
    deliveryPlan: "",
  })
  const [activeFile, setActiveFile] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingDocType, setPendingDocType] = useState<ReviewDocType | null>(null)
  const [notice, setNotice] = useState("")

  const report = buildClarificationReport(form, extraFields)
  const missingInfoSuggestions = useMemo(
    () => buildMissingInfoSuggestions(form, report.requiredMissing),
    [form, report.requiredMissing],
  )
  const activeContent = activeFile in reviewDocs
    ? reviewDocs[activeFile as ReviewDocType]
    : ""
  const canEnterAnalysis = aiResult != null
  const canEnterConfirmedInputs = aiResult != null
  const optionalBlockTotal = optionalCategories.length + 1
  const visibleOptionalCategories = optionalCategories.slice(0, Math.max(0, visibleOptionalBlockCount))
  const showCustomExtension = visibleOptionalBlockCount > optionalCategories.length
  const hasMoreOptionalBlocks = visibleOptionalBlockCount < optionalBlockTotal

  useEffect(() => {
    if (stage !== "input" || pendingScrollCategoryId == null) return

    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(`category-${pendingScrollCategoryId}`)
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" })
      }
      setPendingScrollCategoryId(null)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [pendingScrollCategoryId, stage, visibleOptionalBlockCount])

  function patchField(fieldId: FieldId, value: string) {
    setForm((current) => ({ ...current, [fieldId]: value }))
  }

  function techStackItemsFromValue(value: string) {
    return value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean)
  }

  function appendTechStackItem(nextItem: string) {
    const normalized = nextItem.trim()
    if (!normalized) return

    setForm((current) => {
      const existing = techStackItemsFromValue(current.techStack)
      const hasSameItem = existing.some((item) => item.toLowerCase() === normalized.toLowerCase())
      if (hasSameItem) {
        return current
      }

      return {
        ...current,
        techStack: [...existing, normalized].join("\n"),
      }
    })
  }

  function removeTechStackItem(itemToRemove: string) {
    setForm((current) => ({
      ...current,
      techStack: techStackItemsFromValue(current.techStack)
        .filter((item) => item.toLowerCase() !== itemToRemove.toLowerCase())
        .join("\n"),
    }))
  }

  function createExtraField(): ExtraField {
    return {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `extra-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      label: "",
      value: "",
    }
  }

  function addOutputCustomExtension() {
    setExtraFields((current) => ({
      ...current,
      output: [...current.output, createExtraField()],
    }))
  }

  function patchOutputCustomExtension(id: string, key: "label" | "value", value: string) {
    setExtraFields((current) => ({
      ...current,
      output: current.output.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    }))
  }

  function removeOutputCustomExtension(id: string) {
    setExtraFields((current) => ({
      ...current,
      output: current.output.filter((item) => item.id !== id),
    }))
  }

  async function runAnalysis() {
    if (!report.requiredComplete) return

    setIsSubmitting(true)
    setNotice("")
    setRequestStatus({ kind: "loading", message: "正在从 blueprint-web 直连 agent，生成 AI 摘要和关键问题..." })

    try {
      const payload = await summarizeBlueprint(form, targetRepo, authToken, extraFields)
      setAiResult({
        score: estimateBlueprintScore(form),
        summary: payload.summary,
        keyQuestions: payload.keyQuestions,
      })
      setStage("analysis")
      setRequestStatus({ kind: "success", message: "前端已直连 agent，AI 摘要和关键问题已更新。" })
      setNotice("已完成阶段 2 分析，可以确认进入文档生成。")
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setRequestStatus({ kind: "error", message: `AI 分析失败：${message}` })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function generateReviewDoc(docType: ReviewDocType) {
    setPendingDocType(docType)
    setRequestStatus({ kind: "loading", message: `正在由前端直连 agent 生成 ${REVIEW_FILE_LABELS[docType]}...` })

    try {
      const markdown = await generateBlueprintReviewDoc(form, targetRepo, docType, authToken, extraFields)
      setReviewDocs((current) => ({ ...current, [docType]: markdown }))
      setActiveFile(docType)
      setRequestStatus({ kind: "success", message: `${REVIEW_FILE_LABELS[docType]} 已由前端 agent 生成。` })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setRequestStatus({ kind: "error", message: `${REVIEW_FILE_LABELS[docType]} 生成失败：${message}` })
    } finally {
      setPendingDocType(null)
    }
  }

  function renderCategory(category: CategoryConfig) {
    const isHighlighted = expandedCategoryIds.includes(category.id)
    const isOpen = expandedCategoryIds.includes(category.id)

    return (
      <div key={category.id} id={`category-${category.id}`} className="bp-category-anchor">
        <BlueprintPanel
          title={category.title}
          description={category.description}
          className={isHighlighted ? "bp-panel--highlight" : undefined}
        >
          <div className="bp-category-head">
            {isHighlighted ? <div className="bp-inline-tag">建议补充</div> : <span />}
            <BlueprintButton
              variant="ghost"
              onClick={() =>
                setExpandedCategoryIds((current) =>
                  current.includes(category.id)
                    ? current.filter((id) => id !== category.id)
                    : [...current, category.id],
                )
              }
              ariaLabel={`${isOpen ? "收起" : "展开"}${category.title}`}
            >
              {isOpen ? "收起" : "展开"}
            </BlueprintButton>
          </div>
          {isOpen ? (
            <div className="bp-form-grid">
              {category.fields.map((field) => (
                <div key={field.id} className={field.kind === "textarea" ? "bp-form-grid__span" : undefined}>
                  {field.id === "techStack" ? (
                    <label className="bp-field" htmlFor={field.id}>
                      <span className="bp-field__label">
                        {field.label}
                        {field.required ? <span className="bp-field__required">*</span> : null}
                      </span>
                    <div className="bp-techstack-picker">
                      <div className="bp-techstack-input">
                        <input
                          id={field.id}
                          name={field.id}
                          aria-label={field.label}
                          className="bp-techstack-input__field"
                            placeholder="输入技术栈后按回车添加"
                            value={techStackDraft}
                            onChange={(event) => setTechStackDraft(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key !== "Enter") return
                              event.preventDefault()
                              appendTechStackItem(techStackDraft)
                            setTechStackDraft("")
                          }}
                        />
                      </div>
                      {techStackItemsFromValue(form.techStack).length > 0 ? (
                        <div className="bp-techstack-picker__selected" aria-label={`${field.label} 已选标签`}>
                          {techStackItemsFromValue(form.techStack).map((item) => (
                            <button
                              key={item}
                              type="button"
                              className="bp-techstack-chip"
                              aria-label={`移除 ${item}`}
                              onClick={() => removeTechStackItem(item)}
                            >
                              <span>{item}</span>
                              <span className="bp-techstack-chip__close">x</span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                      <div className="bp-techstack-picker__presets">
                        {TECH_STACK_PRESETS.map((item) => (
                          <button
                            key={item}
                            type="button"
                            className="bp-doc-tab"
                            aria-label={`添加 ${item}`}
                            onClick={() => appendTechStackItem(item)}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                    {field.helper ? <span className="bp-field__hint">{field.helper}</span> : null}
                  </label>
                  ) : (
                    <BlueprintField
                      id={field.id}
                      name={field.id}
                      label={field.label}
                      hint={field.helper}
                      required={field.required}
                      kind={field.kind}
                      options={field.options}
                      placeholder={field.placeholder}
                      value={form[field.id]}
                      onChange={(value) => patchField(field.id, value)}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </BlueprintPanel>
      </div>
    )
  }

  function goToSuggestedCategory(categoryId: CategoryId) {
    setStage("input")
    setNotice("")
    setPendingScrollCategoryId(categoryId)
    setExpandedCategoryIds((current) =>
      current.includes(categoryId) ? current : [...current, categoryId],
    )
    if (categoryId !== "basics") {
      const categoryIndex = optionalCategories.findIndex((category) => category.id === categoryId)
      if (categoryIndex >= 0) {
        setVisibleOptionalBlockCount((current) => Math.max(current, categoryIndex + 1))
      }
    }
  }

  function showMoreOptionalBlocks() {
    setVisibleOptionalBlockCount((current) => Math.min(current + 3, optionalBlockTotal))
  }

  async function handleCopy() {
    if (!activeContent) return
    await copyText(activeContent)
    setNotice(`已复制 ${activeFile}`)
  }

  function handleDownload() {
    if (!activeContent || !activeFile) return
    downloadText(activeFile, activeContent)
    setNotice(`已下载 ${activeFile}`)
  }

  const stageCards = [
    {
      id: "input" as const,
      title: "阶段 1 关键字段录入",
      description: "填写必填信息和补充上下文。",
      status: report.requiredComplete ? "可提交" : "编辑中",
      disabled: false,
    },
    {
      id: "analysis" as const,
      title: "阶段 2 分析与建议",
      description: "查看评分、总结和补充建议。",
      status: aiResult ? "可查看" : "待分析",
      disabled: !aiResult,
    },
    {
      id: "confirmedInputs" as const,
      title: "阶段 3 文档生成",
      description: "生成 review docs。",
      status: canEnterConfirmedInputs ? "可触发" : "未解锁",
      disabled: !canEnterConfirmedInputs,
    },
  ]

  const summaryBlock = aiResult ? (
    <BlueprintSummaryModule
      structuredScore={aiResult.score}
      summary={formatDisplayValue(aiResult.summary)}
      keyQuestions={aiResult.keyQuestions}
      suggestions={missingInfoSuggestions.map((item) => ({
        key: item.key,
        title: item.title,
        reason: item.reason,
        ctaLabel: "去补充",
        onClick: () => goToSuggestedCategory(item.categoryId),
      }))}
    />
  ) : (
    <div className="bp-placeholder">先完成阶段 1 提交，这里才会出现评分、问题和补充建议。</div>
  )

  const reviewModule = (
    <BlueprintDocActionsModule
      title="Review Docs"
      actions={(Object.keys(REVIEW_DOC_LABELS) as ReviewDocType[]).map((docType) => ({
        key: docType,
        label: REVIEW_DOC_LABELS[docType],
        disabled: !canEnterConfirmedInputs || pendingDocType != null,
        loading: pendingDocType === docType,
        onClick: () => generateReviewDoc(docType),
      }))}
      files={(Object.keys(REVIEW_FILE_LABELS) as ReviewDocType[]).map((docType) => ({
        key: docType,
        label: REVIEW_FILE_LABELS[docType],
        disabled: !reviewDocs[docType],
        onClick: () => setActiveFile(docType),
      }))}
      activeFile={activeFile}
      helperText="生成并查看四份 Review Docs。"
    />
  )

  const statusPanel = (
      <BlueprintPanel title="运行状态">
        <div className={`bp-request bp-request--${requestStatus.kind}`}>{requestStatus.message}</div>
      {notice ? <p className="bp-inline-tip bp-inline-tip--spaced">{notice}</p> : null}
      {!authToken ? (
        <div className="bp-login-card">
          <p className="bp-panel__title">当前未登录 PMate</p>
          <p className="bp-panel__meta">可以先填写结构化输入，但 AI 分析和文档生成需要登录后才能使用。</p>
          <div style={{ marginTop: 12 }}>
            <BlueprintButton variant="secondary" onClick={login}>去登录</BlueprintButton>
          </div>
        </div>
      ) : null}
    </BlueprintPanel>
  )

  const inputStagePanel = (
    <BlueprintPanel
      eyebrow="STAGE 1"
      title="关键字段录入"
      description={expandedCategoryIds.length > 1 ? "补充更多结构化信息" : "先把必填字段补齐，再让系统判断还缺什么。"}
    >
      <div className="bp-stack">
        {renderCategory(categories[0]!)}
        {visibleOptionalCategories.map((category) => renderCategory(category))}
        {showCustomExtension ? (
          <BlueprintPanel
            title="自定义扩展"
            description="和“输出形式”同级，用于补充未被固定字段覆盖的扩展信息。"
          >
            <div className="bp-custom-inputs">
              <div className="bp-custom-inputs__head">
                <p className="bp-inline-tip">扩展名称 + 扩展内容</p>
                <BlueprintButton variant="secondary" onClick={addOutputCustomExtension}>
                  新增自定义扩展
                </BlueprintButton>
              </div>
              {extraFields.output.length === 0 ? (
                <div className="bp-placeholder">还没有自定义扩展项，点击“新增自定义扩展”后可填写。</div>
              ) : (
                <div className="bp-custom-inputs__list">
                  {extraFields.output.map((item, index) => (
                    <div key={item.id} className="bp-custom-inputs__item">
                      <BlueprintField
                        id={`custom-extension-name-${item.id}`}
                        name={`custom-extension-name-${item.id}`}
                        label={`扩展名称 ${index + 1}`}
                        placeholder="例如：渠道标签 / 导出模板 / 审核要求"
                        value={item.label}
                        onChange={(value) => patchOutputCustomExtension(item.id, "label", value)}
                      />
                      <div className="bp-form-grid__span">
                        <BlueprintField
                          id={`custom-extension-content-${item.id}`}
                          name={`custom-extension-content-${item.id}`}
                          label={`扩展内容 ${index + 1}`}
                          kind="textarea"
                          placeholder="填写这个扩展对应的具体内容"
                          value={item.value}
                          onChange={(value) => patchOutputCustomExtension(item.id, "value", value)}
                        />
                      </div>
                      <div>
                        <BlueprintButton variant="ghost" onClick={() => removeOutputCustomExtension(item.id)}>
                          删除
                        </BlueprintButton>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </BlueprintPanel>
        ) : null}
        {hasMoreOptionalBlocks ? (
          <div className="bp-load-more">
            <BlueprintButton variant="secondary" onClick={showMoreOptionalBlocks}>
              展开更多字段
            </BlueprintButton>
          </div>
        ) : null}
      </div>
    </BlueprintPanel>
  )

  const inputSubmitBar = (
    <div className="bp-submit-bar-shell">
      <div className="bp-submit-bar-frame">
        <div className="bp-row bp-submit-bar">
          <BlueprintButton
            disabled={!report.requiredComplete || isSubmitting}
            onClick={runAnalysis}
          >
            {isSubmitting ? "提交中..." : "提交"}
          </BlueprintButton>
          {!report.requiredComplete ? (
            <p className="bp-inline-tip">还缺少：{report.requiredMissing.join("、")}</p>
          ) : (
            <p className="bp-inline-tip">必填字段已补齐，可以直接提交进入分析。</p>
          )}
        </div>
      </div>
    </div>
  )

  const inputProgressPanel = (
    <BlueprintPanel title="录入进度">
      <div className="bp-stage-progress">
        <div className="bp-stage-progress__item">
          <span className="bp-stage-progress__label">必填字段</span>
          <strong className="bp-stage-progress__value">
            {report.requiredComplete ? "已补齐" : `${report.requiredMissing.length} 项待补充`}
          </strong>
        </div>
        <div className="bp-stage-progress__item">
          <span className="bp-stage-progress__label">当前目标</span>
          <strong className="bp-stage-progress__value">让 AI 能稳定理解需求</strong>
        </div>
      </div>
      {!report.requiredComplete ? (
        <div className="bp-missing-list">
          <p className="bp-panel__meta">当前还缺少这些关键字段：</p>
          <ul className="bp-list">
            {report.requiredMissing.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bp-placeholder">必填字段已经补齐，可以直接提交进入分析阶段。</div>
      )}
    </BlueprintPanel>
  )

  const stageGuidePanel = (
    <BlueprintPanel title="流程说明">
      <div className="bp-stage-guide">
        <div className={stage === "input" ? "bp-stage-guide__step bp-stage-guide__step--active" : "bp-stage-guide__step"}>
          <p className="bp-panel__title">1. 收集关键输入</p>
          <p className="bp-panel__meta">把产品目标、背景、技术栈和约束补到足够清晰。</p>
        </div>
        <div className={stage === "analysis" ? "bp-stage-guide__step bp-stage-guide__step--active" : "bp-stage-guide__step"}>
          <p className="bp-panel__title">2. 查看分析结论</p>
          <p className="bp-panel__meta">确认 AI 理解没有跑偏，再决定是否回去补充字段。</p>
        </div>
        <div className={stage === "confirmedInputs" ? "bp-stage-guide__step bp-stage-guide__step--active" : "bp-stage-guide__step"}>
          <p className="bp-panel__title">3. 生成 Review Docs</p>
          <p className="bp-panel__meta">输出 Blueprint review docs，并在右侧预览当前文档。</p>
        </div>
      </div>
    </BlueprintPanel>
  )

  const analysisStagePanel = (
    <BlueprintPanel eyebrow="Stage 2" title="分析与建议">
      {summaryBlock}
    </BlueprintPanel>
  )

  const analysisControlPanel = (
    <BlueprintPanel title="分析确认">
      <div className="bp-stage-actions">
        <BlueprintButton
          disabled={!canEnterConfirmedInputs}
          onClick={() => setStage("confirmedInputs")}
        >
          确认进入文档生成
        </BlueprintButton>
      </div>
    </BlueprintPanel>
  )

  const docsStagePanel = (
    <BlueprintPanel eyebrow="Stage 3" title="Review Docs 工作台">
      <p className="bp-panel__meta">按需生成四份 review docs，并随时切换右侧预览内容。</p>
      <div style={{ height: 16 }} />
      <div className="bp-doc-intro-grid">
        {REVIEW_DOC_EXPLANATIONS.map((item) => (
          <div key={item.key} className="bp-doc-intro-card">
            <p className="bp-doc-intro-card__title">{item.title}</p>
            <p className="bp-doc-intro-card__summary">{item.summary}</p>
          </div>
        ))}
      </div>
      <div style={{ height: 16 }} />
      {reviewModule}
      <div style={{ height: 16 }} />
      <div className="bp-stage-actions">
        <BlueprintButton variant="ghost" onClick={() => setStage("analysis")}>
          返回分析
        </BlueprintButton>
      </div>
    </BlueprintPanel>
  )

  const docsPreviewPanel = (
    <BlueprintPanel title={activeFile ? `当前文档：${activeFile}` : "当前文档预览"}>
      {activeContent ? (
        <div className="bp-doc-viewer bp-markdown">
          <Markdown
            options={{
              forceBlock: true,
              overrides: {
                h1: { props: { className: "bp-markdown__h1" } },
                h2: { props: { className: "bp-markdown__h2" } },
                h3: { props: { className: "bp-markdown__h3" } },
                p: { props: { className: "bp-markdown__p" } },
                ul: { props: { className: "bp-markdown__ul" } },
                ol: { props: { className: "bp-markdown__ol" } },
                li: { props: { className: "bp-markdown__li" } },
                blockquote: { props: { className: "bp-markdown__quote" } },
                code: { props: { className: "bp-markdown__code" } },
                pre: { props: { className: "bp-markdown__pre" } },
                hr: { props: { className: "bp-markdown__hr" } },
                table: { props: { className: "bp-markdown__table" } },
                th: { props: { className: "bp-markdown__th" } },
                td: { props: { className: "bp-markdown__td" } },
              },
            }}
          >
            {activeContent}
          </Markdown>
        </div>
      ) : (
        <div className="bp-placeholder">先生成一份文档，右侧会显示当前选中的 Markdown 内容。</div>
      )}
      <div className="bp-actions">
        <BlueprintButton variant="secondary" disabled={!activeContent} onClick={handleCopy}>复制当前文档</BlueprintButton>
        <BlueprintButton variant="secondary" disabled={!activeContent || !activeFile} onClick={handleDownload}>下载当前文档</BlueprintButton>
      </div>
    </BlueprintPanel>
  )

  return (
    <main className="bp-page bp-page--desktop bp-web" data-bp-theme="together-blueprint">
      <section className="bp-hero">
        <div className="bp-hero-wordmark">Blueprint</div>
        <p className="bp-hero-subtitle">把模糊需求整理成可 review 的 Blueprint 文档。</p>
      </section>

      <section className="bp-grid bp-grid--stages">
        {stageCards.map((card) => (
          <BlueprintStageCard
            key={card.id}
            title={card.title}
            description={card.description}
            status={card.status}
            active={stage === card.id}
            disabled={card.disabled}
            onClick={() => {
              if (card.disabled) return
              setStage(card.id)
            }}
          />
        ))}
      </section>

      {stage === "input" ? (
        <>
          <section className="bp-stage-layout bp-stage-layout--input">
            <div className="bp-stage-layout__main">{inputStagePanel}</div>
            <aside className="bp-stage-layout__side bp-stack">
              {statusPanel}
              {inputProgressPanel}
              {stageGuidePanel}
            </aside>
          </section>
          {inputSubmitBar}
        </>
      ) : null}

      {stage === "analysis" ? (
        <section className="bp-stage-layout bp-stage-layout--analysis">
          <div className="bp-stage-layout__main">{analysisStagePanel}</div>
          <aside className="bp-stage-layout__side bp-stack">
            {statusPanel}
            {analysisControlPanel}
            {stageGuidePanel}
          </aside>
        </section>
      ) : null}

      {stage === "confirmedInputs" ? (
        <section className="bp-stage-layout bp-stage-layout--docs">
          <div className="bp-stage-layout__main bp-stack">
            {docsStagePanel}
          </div>
          <aside className="bp-stage-layout__side bp-stack">
            {statusPanel}
            {docsPreviewPanel}
          </aside>
        </section>
      ) : null}
    </main>
  )
}
