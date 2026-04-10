import { useMemo, useState } from "react"
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
  type FieldId,
  buildClarificationReport,
  categories,
  initialExtraFieldsState,
  initialFormState,
} from "./clarifier"
import {
  assertFormalSpecReady,
  estimateBlueprintScore,
  generateBlueprintFormalSpec,
  generateBlueprintReviewDoc,
  summarizeBlueprint,
  type FormalSpecDocType,
  type ReviewDocType,
} from "./blueprintAgent"
import { useBlueprintAuth } from "./pmateAuth"

type StageId = "input" | "analysis" | "confirmedInputs" | "formalSpecs"

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
const FORMAL_FILE_LABELS: Record<FormalSpecDocType, string> = {
  product: "product.md",
  develop: "develop.md",
  qa: "qa.md",
  deploy: "deploy.md",
}

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
  const { login, token: authToken } = useBlueprintAuth()
  const [form, setForm] = useState(initialFormState)
  const [stage, setStage] = useState<StageId>("input")
  const [expandedCategoryId, setExpandedCategoryId] = useState<CategoryId | null>(null)
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
  const [formalDocs, setFormalDocs] = useState<Record<FormalSpecDocType, string>>({
    product: "",
    develop: "",
    qa: "",
    deploy: "",
  })
  const [activeFile, setActiveFile] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingDocType, setPendingDocType] = useState<ReviewDocType | null>(null)
  const [pendingFormalDocType, setPendingFormalDocType] = useState<FormalSpecDocType | null>(null)
  const [deliveryPlanReviewed, setDeliveryPlanReviewed] = useState(false)
  const [notice, setNotice] = useState("")

  const report = buildClarificationReport(form, initialExtraFieldsState)
  const missingInfoSuggestions = useMemo(
    () => buildMissingInfoSuggestions(form, report.requiredMissing),
    [form, report.requiredMissing],
  )
  const activeContent = activeFile in reviewDocs
    ? reviewDocs[activeFile as ReviewDocType]
    : activeFile in formalDocs
      ? formalDocs[activeFile as FormalSpecDocType]
      : ""
  const canEnterConfirmedInputs = stage !== "input" && aiResult != null
  const canEnterFormalSpecs = Object.values(reviewDocs).every(Boolean)

  function patchField(fieldId: FieldId, value: string) {
    setForm((current) => ({ ...current, [fieldId]: value }))
  }

  async function runAnalysis() {
    if (!report.requiredComplete) return

    setIsSubmitting(true)
    setNotice("")
    setRequestStatus({ kind: "loading", message: "正在从 blueprint-web 直连 agent，生成 AI 摘要和关键问题..." })

    try {
      const payload = await summarizeBlueprint(form, targetRepo, authToken)
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
      const markdown = await generateBlueprintReviewDoc(form, targetRepo, docType, authToken)
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

  async function generateFormalSpec(docType: FormalSpecDocType) {
    setPendingFormalDocType(docType)
    setRequestStatus({ kind: "loading", message: `正在校验并由前端直连 agent 生成 ${FORMAL_FILE_LABELS[docType]}...` })

    try {
      assertFormalSpecReady(deliveryPlanReviewed)
      const markdown = await generateBlueprintFormalSpec(form, targetRepo, docType, authToken)
      setFormalDocs((current) => ({ ...current, [docType]: markdown }))
      setActiveFile(docType)
      setRequestStatus({ kind: "success", message: `${FORMAL_FILE_LABELS[docType]} 已由前端 agent 生成。` })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setRequestStatus({ kind: "error", message: `${FORMAL_FILE_LABELS[docType]} 生成失败：${message}` })
    } finally {
      setPendingFormalDocType(null)
    }
  }

  function renderCategory(category: CategoryConfig) {
    const isHighlighted = expandedCategoryId === category.id
    const isOpen = expandedCategoryId ? expandedCategoryId === category.id : category.id === "basics"

    return (
      <BlueprintPanel
        key={category.id}
        title={category.title}
        description={category.description}
        className={isHighlighted ? "bp-panel--highlight" : undefined}
      >
        <div className="bp-category-head">
          {isHighlighted ? <div className="bp-inline-tag">建议补充</div> : <span />}
          <BlueprintButton
            variant="ghost"
            onClick={() => setExpandedCategoryId(isOpen ? null : category.id)}
            ariaLabel={`${isOpen ? "收起" : "展开"}${category.title}`}
          >
            {isOpen ? "收起" : "展开"}
          </BlueprintButton>
        </div>
        {isOpen ? (
          <div className="bp-form-grid">
            {category.fields.map((field) => (
              <div key={field.id} className={field.kind === "textarea" ? "bp-form-grid__span" : undefined}>
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
              </div>
            ))}
          </div>
        ) : null}
      </BlueprintPanel>
    )
  }

  function goToSuggestedCategory(categoryId: CategoryId) {
    setStage("input")
    setExpandedCategoryId(categoryId)
    setNotice("已回到阶段 1，请补充更多结构化信息。")
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
    {
      id: "formalSpecs" as const,
      title: "阶段 4 正式规格",
      description: "生成 product/develop/qa/deploy。",
      status: canEnterFormalSpecs ? "可触发" : "未解锁",
      disabled: !canEnterFormalSpecs,
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
    <div className="bp-placeholder">先在左侧提交，右侧才会出现评分、问题和补充建议。</div>
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
      helperText={canEnterFormalSpecs ? "Review Docs 已齐，可以进入正式规格。" : "需要先完成四份 Review Docs。"}
    />
  )

  const formalModule = (
    <BlueprintDocActionsModule
      title="Formal Specs"
      actions={(Object.keys(FORMAL_FILE_LABELS) as FormalSpecDocType[]).map((docType) => ({
        key: docType,
        label: `生成 ${FORMAL_FILE_LABELS[docType]}`,
        disabled: !deliveryPlanReviewed || !canEnterFormalSpecs || pendingFormalDocType != null,
        loading: pendingFormalDocType === docType,
        onClick: () => generateFormalSpec(docType),
      }))}
      files={(Object.keys(FORMAL_FILE_LABELS) as FormalSpecDocType[]).map((docType) => ({
        key: docType,
        label: FORMAL_FILE_LABELS[docType],
        disabled: !formalDocs[docType],
        onClick: () => setActiveFile(docType),
      }))}
      activeFile={activeFile}
      helperText={deliveryPlanReviewed ? "已确认 delivery-plan.md，可继续生成正式规格。" : "先勾选 review delivery-plan.md。"}
    />
  )

  return (
    <main className="bp-page bp-page--desktop bp-web">
      <section className="bp-hero">
        <p className="bp-eyebrow">Blueprint Workspace</p>
        <h1 className="bp-title">Blueprint 四阶段澄清与规格生成</h1>
        <p className="bp-subtitle">先收集关键字段，再做 AI 分析，确认进入 review docs，最后再生成 formal specs。</p>
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
            onClick={() => !card.disabled && setStage(card.id)}
          />
        ))}
      </section>

      <section className="bp-grid bp-grid--main">
        <section className="bp-stack">
          <BlueprintPanel
            title="关键字段录入"
            description={expandedCategoryId ? "补充更多结构化信息" : "先把必填字段补齐，再让系统判断还缺什么。"}
          >
            <div className="bp-stack">
              {categories.map((category) => renderCategory(category))}
              <div className="bp-row">
                <BlueprintButton
                  disabled={!report.requiredComplete || isSubmitting}
                  onClick={runAnalysis}
                >
                  {isSubmitting ? "提交中..." : "提交"}
                </BlueprintButton>
                {!report.requiredComplete ? (
                  <p className="bp-inline-tip">还缺少：{report.requiredMissing.join("、")}</p>
                ) : null}
              </div>
            </div>
          </BlueprintPanel>
        </section>

        <aside className="bp-stack">
          <BlueprintPanel title="运行状态">
            <div className={`bp-request bp-request--${requestStatus.kind}`}>{requestStatus.message}</div>
            {notice ? <p className="bp-inline-tip">{notice}</p> : null}
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

          <BlueprintPanel eyebrow="Stage 2" title="分析与建议">
            {summaryBlock}
            <div style={{ height: 12 }} />
            <BlueprintField
              id="targetRepo"
              name="targetRepo"
              label="目标仓库"
              value={targetRepo}
              onChange={setTargetRepo}
            />
            <div style={{ height: 12 }} />
            <BlueprintButton
              disabled={!canEnterConfirmedInputs}
              onClick={() => setStage("confirmedInputs")}
            >
              确认进入文档生成
            </BlueprintButton>
          </BlueprintPanel>

          <BlueprintPanel eyebrow="Stage 3" title="Review Docs">
            {reviewModule}
            <div style={{ height: 12 }} />
            <BlueprintButton
              variant="secondary"
              disabled={!canEnterFormalSpecs}
              onClick={() => setStage("formalSpecs")}
            >
              进入正式规格
            </BlueprintButton>
          </BlueprintPanel>

          <BlueprintPanel eyebrow="Stage 4" title="Formal Specs">
            <label className="bp-checkline">
              <input
                aria-label="已 review delivery-plan.md"
                type="checkbox"
                checked={deliveryPlanReviewed}
                onChange={(event) => setDeliveryPlanReviewed(event.target.checked)}
              />
              已 review delivery-plan.md
            </label>
            <div style={{ height: 12 }} />
            {formalModule}
          </BlueprintPanel>

          <BlueprintPanel title="当前文档">
            {activeContent ? (
              <pre className="bp-doc-viewer">{activeContent}</pre>
            ) : (
              <div className="bp-placeholder">生成文档后，这里会显示当前选中的 Markdown 内容。</div>
            )}
            <div className="bp-actions">
              <BlueprintButton variant="secondary" disabled={!activeContent} onClick={handleCopy}>复制当前文档</BlueprintButton>
              <BlueprintButton variant="secondary" disabled={!activeContent || !activeFile} onClick={handleDownload}>下载当前文档</BlueprintButton>
            </div>
          </BlueprintPanel>
        </aside>
      </section>
    </main>
  )
}
