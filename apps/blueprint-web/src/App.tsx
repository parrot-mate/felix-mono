import { useMemo, useState } from "react"
import { getBlueprintAuthToken } from "./auth"
import {
  type CategoryConfig,
  type CategoryId,
  type FieldConfig,
  type FieldId,
  buildClarificationReport,
  categories,
  initialExtraFieldsState,
  initialFormState,
} from "./clarifier"

type StageId = "input" | "analysis" | "confirmedInputs" | "formalSpecs"
type ReviewDocType = "prdLite" | "scenarios" | "decisions" | "deliveryPlan"
type FormalSpecDocType = "product" | "develop" | "qa" | "deploy"

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
  categoryId: CategoryId
  title: string
  reason: string
}

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8794"
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

function buildApiBaseUrl() {
  const raw = import.meta.env.VITE_BLUEPRINT_API_BASE_URL?.trim()
  return (raw || DEFAULT_API_BASE_URL).replace(/\/+$/, "")
}

function buildAuthHeaders() {
  const token = getBlueprintAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function fieldClass(kind: FieldConfig["kind"]) {
  return kind === "textarea" ? "field min-h-28 resize-y" : "field"
}

function parseTagList(value: string) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function buildAiPayload(form: typeof initialFormState) {
  const payload: Record<string, unknown> = {
    productName: form.productName.trim(),
    productGoal: form.productGoal.trim(),
    background: form.background.trim(),
    techStack: form.techStack.trim(),
    uiStyle: form.uiStyle.trim(),
    language: "zh",
  }

  for (const [key, value] of Object.entries(form)) {
    if (key in payload) continue
    const trimmed = value.trim()
    if (trimmed) {
      payload[key] = trimmed
    }
  }

  return payload
}

function normalizeScore(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return 0
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
      categoryId: "basics",
      title: "先补齐关键字段",
      reason: `当前还缺少：${requiredMissing.join("、")}。这些字段会直接影响分析稳定性。`,
    })
  }

  if (!form.targetUsers.trim() || !form.currentSolution.trim() || !form.userPain.trim()) {
    suggestions.push({
      categoryId: "users",
      title: "补充用户相关信息",
      reason: "目标用户、现有解决方式或痛点还不完整，系统容易只看到功能而看不到使用上下文。",
    })
  }

  if (!form.usageScenarios.trim() || !form.usageFrequency.trim()) {
    suggestions.push({
      categoryId: "usage",
      title: "补充使用场景",
      reason: "任务场景或使用频率不足，后续 scenarios 容易写成页面清单而不是任务流。",
    })
  }

  if (!form.coreFeatures.trim() || !form.mustHaveFeatures.trim()) {
    suggestions.push({
      categoryId: "features",
      title: "补充功能边界",
      reason: "核心功能和必须功能还没有分清，范围容易继续发散。",
    })
  }

  if (!form.userInputs.trim() || !form.systemOutputs.trim()) {
    suggestions.push({
      categoryId: "io",
      title: "补充输入输出",
      reason: "用户输入或系统输出还不清楚，文档会缺少交付结果定义。",
    })
  }

  if (!form.platformLimits.trim() || !form.technicalLimits.trim()) {
    suggestions.push({
      categoryId: "constraints",
      title: "补充约束条件",
      reason: "平台或技术限制不完整，开发和部署建议会偏保守或不准确。",
    })
  }

  if (!form.successDefinition.trim()) {
    suggestions.push({
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

  async function postJson(url: string, body: unknown) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...buildAuthHeaders(),
      },
      body: JSON.stringify(body),
    })
    const payload = await response.json()
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || "Request failed")
    }
    return payload
  }

  async function runAnalysis() {
    if (!report.requiredComplete) return

    setIsSubmitting(true)
    setNotice("")
    setRequestStatus({ kind: "loading", message: "正在提交表单并进行评分、总结和分析..." })

    try {
      const payload = await postJson(`${buildApiBaseUrl()}/api/blueprint/summarize`, buildAiPayload(form))
      setAiResult({
        score: normalizeScore(payload.data.score),
        summary: typeof payload.data.summary === "string" ? payload.data.summary : "",
        keyQuestions: Array.isArray(payload.data.keyQuestions) ? payload.data.keyQuestions.slice(0, 3) : [],
      })
      setStage("analysis")
      setRequestStatus({ kind: "success", message: "评分、总结和分析问题已更新。" })
      setNotice("已完成阶段 2 分析，可以确认进入文档生成。")
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setRequestStatus({ kind: "error", message: `分析请求失败：${message}` })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function generateReviewDoc(docType: ReviewDocType) {
    setPendingDocType(docType)
    setRequestStatus({ kind: "loading", message: `正在生成 ${REVIEW_FILE_LABELS[docType]}...` })

    try {
      const payload = await postJson(`${buildApiBaseUrl()}/api/blueprint/markdown`, {
        ...buildAiPayload(form),
        targetRepo,
        docType,
      })
      setReviewDocs((current) => ({ ...current, [docType]: payload.data.markdown }))
      setActiveFile(docType)
      setRequestStatus({ kind: "success", message: `${REVIEW_FILE_LABELS[docType]} 已生成。` })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setRequestStatus({ kind: "error", message: `${REVIEW_FILE_LABELS[docType]} 生成失败：${message}` })
    } finally {
      setPendingDocType(null)
    }
  }

  async function generateFormalSpec(docType: FormalSpecDocType) {
    setPendingFormalDocType(docType)
    setRequestStatus({ kind: "loading", message: `正在校验并生成 ${FORMAL_FILE_LABELS[docType]}...` })

    try {
      await postJson(`${buildApiBaseUrl()}/api/blueprint/formal-spec/check`, {
        docType,
        deliveryPlanReviewed,
      })
      const payload = await postJson(`${buildApiBaseUrl()}/api/blueprint/formal-spec/markdown`, {
        ...buildAiPayload(form),
        targetRepo,
        docType,
        deliveryPlanReviewed,
      })
      setFormalDocs((current) => ({ ...current, [docType]: payload.data.markdown }))
      setActiveFile(docType)
      setRequestStatus({ kind: "success", message: `${FORMAL_FILE_LABELS[docType]} 已生成。` })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setRequestStatus({ kind: "error", message: `${FORMAL_FILE_LABELS[docType]} 生成失败：${message}` })
    } finally {
      setPendingFormalDocType(null)
    }
  }

  function scoreTone(score: number) {
    if (score < 5) return "text-rose-700 border-rose-200 bg-rose-50"
    if (score < 7) return "text-amber-800 border-amber-200 bg-amber-50"
    return "text-emerald-700 border-emerald-200 bg-emerald-50"
  }

  function renderField(field: FieldConfig) {
    if (field.id === "techStack") {
      return (
        <textarea
          aria-label={field.label}
          className={fieldClass("textarea")}
          value={form.techStack}
          placeholder={field.placeholder}
          onChange={(event) => patchField(field.id, event.target.value)}
        />
      )
    }

    if (field.kind === "textarea") {
      return (
        <textarea
          aria-label={field.label}
          className={fieldClass(field.kind)}
          value={form[field.id]}
          placeholder={field.placeholder}
          onChange={(event) => patchField(field.id, event.target.value)}
        />
      )
    }

    if (field.kind === "select") {
      return (
        <select
          aria-label={field.label}
          className={fieldClass(field.kind)}
          value={form[field.id]}
          onChange={(event) => patchField(field.id, event.target.value)}
        >
          {(field.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )
    }

    return (
      <input
        aria-label={field.label}
        className={fieldClass(field.kind)}
        value={form[field.id]}
        placeholder={field.placeholder}
        onChange={(event) => patchField(field.id, event.target.value)}
      />
    )
  }

  function renderCategory(category: CategoryConfig) {
    const isHighlighted = expandedCategoryId === category.id

    return (
      <section key={category.id} className={`panel p-5 ${isHighlighted ? "ring-2 ring-amber-300" : ""}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-stone-950">{category.title}</h2>
            <p className="mt-1 text-sm text-stone-600">{category.description}</p>
          </div>
          {isHighlighted ? <span className="tag tag-required">建议补充</span> : null}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {category.fields.map((field) => (
            <label key={field.id} className={field.kind === "textarea" ? "field-wrap md:col-span-2" : "field-wrap"}>
              <span className="field-label">
                {field.label}
                {field.required ? <span className="ml-2 text-rose-500">*</span> : null}
              </span>
              {renderField(field)}
              {field.helper ? <span className="field-helper">{field.helper}</span> : null}
            </label>
          ))}
        </div>
      </section>
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

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="hero-panel">
          <p className="eyebrow">Blueprint Workspace</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">Blueprint 四阶段澄清与规格生成</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-stone-700">
            先收集关键字段，再做 AI 分析，确认进入 review docs，最后再生成 formal specs。
          </p>
        </section>

        <section className="mt-6 grid gap-3 md:grid-cols-4">
          <button type="button" className="panel px-4 py-4 text-left" onClick={() => setStage("input")}>
            <div className="text-sm font-semibold text-stone-950">阶段 1 关键字段录入</div>
            <p className="mt-1 text-sm text-stone-600">填写必填信息和补充上下文。</p>
          </button>
          <button type="button" className="panel px-4 py-4 text-left" disabled={!aiResult} onClick={() => aiResult && setStage("analysis")}>
            <div className="text-sm font-semibold text-stone-950">阶段 2 分析与建议</div>
            <p className="mt-1 text-sm text-stone-600">查看评分、总结和补充建议。</p>
          </button>
          <button type="button" className="panel px-4 py-4 text-left" disabled={!canEnterConfirmedInputs} onClick={() => canEnterConfirmedInputs && setStage("confirmedInputs")}>
            <div className="text-sm font-semibold text-stone-950">阶段 3 文档生成</div>
            <p className="mt-1 text-sm text-stone-600">生成 confirmed docs。</p>
          </button>
          <button type="button" className="panel px-4 py-4 text-left" disabled={!canEnterFormalSpecs} onClick={() => canEnterFormalSpecs && setStage("formalSpecs")}>
            <div className="text-sm font-semibold text-stone-950">阶段 4 正式规格</div>
            <p className="mt-1 text-sm text-stone-600">生成 product/develop/qa/deploy。</p>
          </button>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="space-y-4">
            <section className="panel p-5">
              <h2 className="text-xl font-semibold text-stone-950">关键字段录入</h2>
              <p className="mt-2 text-sm text-stone-600">
                {expandedCategoryId ? "补充更多结构化信息" : "先把必填字段补齐，再让系统判断还缺什么。"}
              </p>
            </section>

            {categories.map((category) => renderCategory(category))}

            <section className="panel p-5">
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" className="primary-button" disabled={!report.requiredComplete || isSubmitting} onClick={runAnalysis}>
                  {isSubmitting ? "提交中..." : "提交"}
                </button>
                {!report.requiredComplete ? (
                  <p className="text-sm text-rose-600">还缺少：{report.requiredMissing.join("、")}</p>
                ) : null}
              </div>
            </section>
          </section>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <section className="panel p-5">
              <div
                className={
                  requestStatus.kind === "error"
                    ? "rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                    : requestStatus.kind === "success"
                      ? "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                      : requestStatus.kind === "loading"
                        ? "rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
                        : "rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600"
                }
              >
                {requestStatus.message}
              </div>
              {notice ? <p className="mt-3 text-sm text-amber-700">{notice}</p> : null}
            </section>

            <section className="panel p-5">
              <p className="eyebrow">Stage 2</p>
              <h2 className="mt-2 text-xl font-semibold text-stone-950">分析与建议</h2>

              {aiResult ? (
                <div className="mt-4 space-y-4">
                  <div className={`rounded-[1.4rem] border px-4 py-4 text-3xl font-semibold ${scoreTone(aiResult.score)}`}>{aiResult.score} / 10</div>
                  <div>
                    <h3 className="text-sm font-semibold text-stone-900">总结</h3>
                    <div className="doc-viewer mt-2 whitespace-pre-wrap">{formatDisplayValue(aiResult.summary)}</div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-stone-900">分析</h3>
                    <div className="doc-viewer mt-2">
                      <ol className="space-y-2">
                        {aiResult.keyQuestions.map((item, index) => (
                          <li key={`${index}-${item}`}>{index + 1}. {item}</li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">这些内容由系统在阶段 2 自动推荐</p>
                    <h3 className="mt-2 text-sm font-semibold text-stone-900">建议补充的信息</h3>
                    <div className="mt-3 space-y-3">
                      {missingInfoSuggestions.map((item) => (
                        <div key={`${item.categoryId}-${item.title}`} className="rounded-2xl border border-stone-200 bg-white px-4 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-stone-900">{item.title}</p>
                              <p className="mt-1 text-sm text-stone-600">{item.reason}</p>
                            </div>
                            <button type="button" className="secondary-button" onClick={() => goToSuggestedCategory(item.categoryId)}>
                              去补充
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <label className="field-wrap">
                    <span className="field-label">目标仓库</span>
                    <input aria-label="目标仓库" className="field" value={targetRepo} onChange={(event) => setTargetRepo(event.target.value)} />
                  </label>

                  <button type="button" className="primary-button" onClick={() => setStage("confirmedInputs")}>
                    确认进入文档生成
                  </button>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-5 text-sm text-stone-600">
                  先在左侧提交，右侧才会出现评分、问题和补充建议。
                </div>
              )}
            </section>

            <section className="panel p-5">
              <p className="eyebrow">Stage 3</p>
              <h2 className="mt-2 text-xl font-semibold text-stone-950">Review Docs</h2>
              <div className="mt-4 flex flex-wrap gap-3">
                {(Object.keys(REVIEW_DOC_LABELS) as ReviewDocType[]).map((docType) => (
                  <button
                    key={docType}
                    type="button"
                    className="primary-button"
                    disabled={!canEnterConfirmedInputs || pendingDocType != null}
                    onClick={() => generateReviewDoc(docType)}
                  >
                    {pendingDocType === docType ? `${REVIEW_DOC_LABELS[docType]} 中...` : REVIEW_DOC_LABELS[docType]}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                {(Object.keys(REVIEW_FILE_LABELS) as ReviewDocType[]).map((docType) => (
                  <button
                    key={docType}
                    type="button"
                    className={activeFile === docType ? "tab-active" : "tab"}
                    disabled={!reviewDocs[docType]}
                    onClick={() => setActiveFile(docType)}
                  >
                    {REVIEW_FILE_LABELS[docType]}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex gap-3">
                <button type="button" className="secondary-button" disabled={!canEnterFormalSpecs} onClick={() => setStage("formalSpecs")}>
                  进入正式规格
                </button>
              </div>
            </section>

            <section className="panel p-5">
              <p className="eyebrow">Stage 4</p>
              <h2 className="mt-2 text-xl font-semibold text-stone-950">Formal Specs</h2>
              <label className="mt-4 flex items-center gap-3 text-sm text-stone-700">
                <input
                  aria-label="已 review delivery-plan.md"
                  type="checkbox"
                  checked={deliveryPlanReviewed}
                  onChange={(event) => setDeliveryPlanReviewed(event.target.checked)}
                />
                已 review delivery-plan.md
              </label>

              <div className="mt-4 flex flex-wrap gap-3">
                {(Object.keys(FORMAL_FILE_LABELS) as FormalSpecDocType[]).map((docType) => (
                  <button
                    key={docType}
                    type="button"
                    className="primary-button"
                    disabled={!deliveryPlanReviewed || !canEnterFormalSpecs || pendingFormalDocType != null}
                    onClick={() => generateFormalSpec(docType)}
                  >
                    {pendingFormalDocType === docType ? `生成 ${FORMAL_FILE_LABELS[docType]} 中...` : `生成 ${FORMAL_FILE_LABELS[docType]}`}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                {(Object.keys(FORMAL_FILE_LABELS) as FormalSpecDocType[]).map((docType) => (
                  <button
                    key={docType}
                    type="button"
                    className={activeFile === docType ? "tab-active" : "tab"}
                    disabled={!formalDocs[docType]}
                    onClick={() => setActiveFile(docType)}
                  >
                    {FORMAL_FILE_LABELS[docType]}
                  </button>
                ))}
              </div>
            </section>

            <section className="panel p-5">
              <h2 className="text-xl font-semibold text-stone-950">当前文档</h2>
              {activeContent ? (
                <pre className="doc-viewer mt-4 whitespace-pre-wrap">{activeContent}</pre>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-5 text-sm text-stone-600">
                  生成文档后，这里会显示当前选中的 Markdown 内容。
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" className="secondary-button" disabled={!activeContent} onClick={handleCopy}>
                  复制当前文档
                </button>
                <button type="button" className="secondary-button" disabled={!activeContent || !activeFile} onClick={handleDownload}>
                  下载当前文档
                </button>
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  )
}
