import { useState } from "react"
import {
  type CategoryConfig,
  type CategoryId,
  type ExtraField,
  type FieldConfig,
  type FieldId,
  buildClarificationReport,
  categories,
  initialExtraFieldsState,
  initialFormState,
} from "./clarifier"

type ActiveDoc = "prd" | "scenarios"
type AnalysisAction = "submit" | "update"
type GeneratedDocType = "prd" | "scenarios"

type AiResult = {
  score: number
  summary: string
  keyQuestions: string[]
}

type AgentDebugInfo = {
  agentId: string
  payload: unknown
  rawAgentResponse: unknown
  unwrappedAgentResponse: unknown
}

type ApiDebugResponse = {
  debug?: AgentDebugInfo
}

type RequestStatus =
  | { kind: "idle"; message: string }
  | { kind: "loading"; message: string }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string }

type DebugState = {
  analysis?: AgentDebugInfo | null
  doc?: AgentDebugInfo | null
}

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8797"

const TECH_STACK_SUGGESTIONS = [
  "Vite",
  "React",
  "TailwindCSS",
  "TypeScript",
  "Node.js",
  "Elysia",
  "Vitest",
  "Playwright",
  "PostgreSQL",
  "Redis",
  "OpenAI API",
  "Cloudflare",
]

const TECH_STACK_RELATIONS: Record<string, string[]> = {
  Vite: ["React", "TailwindCSS", "TypeScript", "Vitest"],
  React: ["Vite", "TailwindCSS", "TypeScript", "Playwright"],
  TailwindCSS: ["Vite", "React", "TypeScript"],
  "Node.js": ["Elysia", "PostgreSQL", "Redis", "TypeScript"],
  Elysia: ["Node.js", "TypeScript", "PostgreSQL", "Redis"],
  TypeScript: ["Vite", "React", "Node.js", "Elysia"],
  PostgreSQL: ["Node.js", "Elysia", "Redis"],
  Redis: ["Node.js", "Elysia", "PostgreSQL"],
  Vitest: ["Vite", "React", "TypeScript"],
  Playwright: ["React", "Vite", "TailwindCSS"],
}

function fieldClass(kind: FieldConfig["kind"]) {
  return kind === "textarea" ? "field min-h-28 resize-y" : "field"
}

function safeExtraId() {
  return `extra-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
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

function buildApiBaseUrl() {
  const raw = import.meta.env.VITE_BLUEPRINT_API_BASE_URL?.trim()
  return (raw || DEFAULT_API_BASE_URL).replace(/\/+$/, "")
}

function parseTagList(value: string) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function getSuggestedTechStacks(selectedItems: string[]) {
  const selectedSet = new Set(selectedItems)
  const scored = TECH_STACK_SUGGESTIONS
    .filter((item) => !selectedSet.has(item))
    .map((item) => {
      const relatedScore = selectedItems.reduce((score, selected) => {
        return score + (TECH_STACK_RELATIONS[selected]?.includes(item) ? 2 : 0)
      }, 0)
      const preferredScore = ["Vite", "React", "TailwindCSS", "TypeScript", "Node.js", "Elysia"].includes(item) ? 1 : 0
      return { item, score: relatedScore + preferredScore }
    })
    .sort((a, b) => b.score - a.score || TECH_STACK_SUGGESTIONS.indexOf(a.item) - TECH_STACK_SUGGESTIONS.indexOf(b.item))

  return scored.map((entry) => entry.item)
}

function formatDisplayValue(value: unknown) {
  if (value == null) return ""
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function formatDebugValue(value: unknown) {
  if (value == null) return "null"
  if (typeof value === "string") return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function normalizeScore(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function buildAiPayload(form: typeof initialFormState, globalExtraFields: ExtraField[]) {
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

  const normalizedExtras = globalExtraFields
    .map((item) => ({
      label: item.label.trim(),
      value: item.value.trim(),
    }))
    .filter((item) => item.label || item.value)

  if (normalizedExtras.length) {
    payload.extras = { global: normalizedExtras }
  }

  return payload
}

export function App() {
  const [form, setForm] = useState(initialFormState)
  const [globalExtraFields, setGlobalExtraFields] = useState<ExtraField[]>([])
  const [techStackDraft, setTechStackDraft] = useState("")
  const [visibleCategoryCount, setVisibleCategoryCount] = useState(3)
  const [visibleOptionalCounts, setVisibleOptionalCounts] = useState<Record<CategoryId, number>>(
    () =>
      Object.fromEntries(
        categories.map((category) => [category.id, 3]),
      ) as Record<CategoryId, number>,
  )
  const [activeDoc, setActiveDoc] = useState<ActiveDoc>("prd")
  const [docs, setDocs] = useState<{ prdLite: string; scenarios: string }>({
    prdLite: "",
    scenarios: "",
  })
  const [aiResult, setAiResult] = useState<AiResult | null>(null)
  const [debugState, setDebugState] = useState<DebugState>({})
  const [requestStatus, setRequestStatus] = useState<RequestStatus>({
    kind: "idle",
    message: "等待提交表单后开始分析。",
  })
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false)
  const [isDocsLoading, setIsDocsLoading] = useState(false)
  const [pendingDocType, setPendingDocType] = useState<GeneratedDocType | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [notice, setNotice] = useState("")

  const report = buildClarificationReport(form, initialExtraFieldsState)
  const activeDocContent = activeDoc === "prd" ? docs.prdLite : docs.scenarios

  function scoreTone(score: number) {
    if (score < 5) return "text-rose-700 border-rose-200 bg-rose-50"
    if (score < 7) return "text-amber-800 border-amber-200 bg-amber-50"
    return "text-emerald-700 border-emerald-200 bg-emerald-50"
  }

  function patchField(fieldId: FieldId, value: string) {
    setForm((current) => ({ ...current, [fieldId]: value }))
    setIsDirty(true)
  }

  function commitTechStackDraft(rawValue: string) {
    const nextItems = parseTagList(rawValue)
    if (!nextItems.length) return

    const currentItems = parseTagList(form.techStack)
    const merged = [...currentItems]
    for (const item of nextItems) {
      if (!merged.includes(item)) {
        merged.push(item)
      }
    }

    patchField("techStack", merged.join("\n"))
    setTechStackDraft("")
  }

  function addTechStackItem(itemToAdd: string) {
    commitTechStackDraft(itemToAdd)
  }

  function removeTechStackItem(itemToRemove: string) {
    const nextItems = parseTagList(form.techStack).filter((item) => item !== itemToRemove)
    patchField("techStack", nextItems.join("\n"))
  }

  function addExtraField() {
    const nextField: ExtraField = { id: safeExtraId(), label: "", value: "" }
    setGlobalExtraFields((current) => [...current, nextField])
    setIsDirty(true)
  }

  function patchExtraField(extraId: string, key: "label" | "value", value: string) {
    setGlobalExtraFields((current) =>
      current.map((item) => (item.id === extraId ? { ...item, [key]: value } : item)),
    )
    setIsDirty(true)
  }

  function removeExtraField(extraId: string) {
    setGlobalExtraFields((current) => current.filter((item) => item.id !== extraId))
    setIsDirty(true)
  }

  function showMoreFields(categoryId: CategoryId) {
    setVisibleOptionalCounts((current) => ({
      ...current,
      [categoryId]: current[categoryId] + 3,
    }))
  }

  function showMoreCategories() {
    setVisibleCategoryCount((current) => current + 3)
  }

  async function runAnalysis(action: AnalysisAction) {
    if (!report.requiredComplete) return

    const payload = buildAiPayload(form, globalExtraFields)
    setIsAnalysisLoading(true)
    setNotice("")
    setDebugState({})
    setRequestStatus({
      kind: "loading",
      message: action === "submit" ? "正在提交表单并进行评分、总结和分析..." : "正在根据最新表单同步更新评分、总结和分析...",
    })

    try {
      const analysisResponse = await fetch(`${buildApiBaseUrl()}/api/blueprint/summarize`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const analysisPayload = (await analysisResponse.json()) as
        | ({ ok: true; data: AiResult } & ApiDebugResponse)
        | ({ ok: false; error?: string } & ApiDebugResponse)

      setDebugState({
        analysis: analysisPayload.debug ?? null,
        doc: null,
      })

      if (!analysisResponse.ok || !analysisPayload.ok) {
        throw new Error(analysisPayload.ok ? "AI analysis request failed" : analysisPayload.error || "AI analysis request failed")
      }

      setAiResult({
        ...analysisPayload.data,
        score: normalizeScore(analysisPayload.data.score) ?? 0,
        summary: typeof analysisPayload.data.summary === "string" ? analysisPayload.data.summary : "",
        keyQuestions: analysisPayload.data.keyQuestions?.slice(0, 3) ?? [],
      })
      setIsSubmitted(true)
      setIsDirty(false)
      setRequestStatus({
        kind: "success",
        message: "评分、总结和分析问题已更新。",
      })
      setNotice(action === "submit" ? "提交完成，右侧已生成最新评分、总结和分析。" : "更新完成，右侧已刷新最新评分、总结和分析。")
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setRequestStatus({
        kind: "error",
        message: `分析请求失败：${message}`,
      })
    } finally {
      setIsAnalysisLoading(false)
    }
  }

  async function generateReviewDoc(docType: GeneratedDocType) {
    if (!report.requiredComplete || !isSubmitted) return

    setIsDocsLoading(true)
    setPendingDocType(docType)
    setNotice("")
    setRequestStatus({
      kind: "loading",
      message: docType === "prd" ? "正在生成 PRD-Lite 文档..." : "正在生成 Scenario 文档...",
    })

    try {
      const response = await fetch(`${buildApiBaseUrl()}/api/blueprint/markdown`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          ...buildAiPayload(form, globalExtraFields),
          docType: docType === "prd" ? "prdLite" : "scenarios",
        }),
      })

      const payload = (await response.json()) as
        | ({ ok: true; data: { docType: "prdLite" | "scenarios"; markdown: string } } & ApiDebugResponse)
        | ({ ok: false; error?: string } & ApiDebugResponse)

      setDebugState((current) => ({
        ...current,
        doc: payload.debug ?? null,
      }))

      if (!response.ok || !payload.ok) {
        throw new Error(payload.ok ? "Doc request failed" : payload.error || "Doc request failed")
      }

      setDocs((current) => ({
        prdLite: payload.data.docType === "prdLite" ? payload.data.markdown : current.prdLite,
        scenarios: payload.data.docType === "scenarios" ? payload.data.markdown : current.scenarios,
      }))
      setActiveDoc(docType)
      setRequestStatus({
        kind: "success",
        message: docType === "prd" ? "PRD-Lite 已生成并展示在右侧。" : "Scenario 已生成并展示在右侧。",
      })
      setNotice(docType === "prd" ? "已生成 prd-lite.md。" : "已生成 scenarios.md。")
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setRequestStatus({
        kind: "error",
        message: `${docType === "prd" ? "PRD-Lite" : "Scenario"} 生成失败：${message}`,
      })
    } finally {
      setIsDocsLoading(false)
      setPendingDocType(null)
    }
  }

  async function handleCopy() {
    if (!activeDocContent) return
    await copyText(activeDocContent)
    setNotice(activeDoc === "prd" ? "已复制 prd-lite.md" : "已复制 scenarios.md")
  }

  function handleDownload() {
    if (!activeDocContent) return
    if (activeDoc === "prd") {
      downloadText("prd-lite.md", activeDocContent)
      setNotice("已下载 prd-lite.md")
      return
    }
    downloadText("scenarios.md", activeDocContent)
    setNotice("已下载 scenarios.md")
  }

  function renderField(field: FieldConfig) {
    if (field.id === "techStack") {
      const techItems = parseTagList(form.techStack)
      const suggestedItems = getSuggestedTechStacks(techItems).slice(0, 8)

      return (
        <div className="rounded-2xl border border-stone-300 bg-white px-4 py-3 transition focus-within:border-amber-600 focus-within:ring-4 focus-within:ring-amber-100">
          {techItems.length ? (
            <div className="mb-3 flex flex-wrap gap-2">
              {techItems.map((item) => (
                <span key={item} className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-900">
                  {item}
                  <button
                    type="button"
                    className="text-amber-700 transition hover:text-amber-950"
                    aria-label={`删除 ${item}`}
                    onClick={() => removeTechStackItem(item)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : null}

          <div className="mb-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">推荐技术栈</p>
            <div className="flex flex-wrap gap-2">
              {suggestedItems.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-sm font-medium text-stone-700 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-900"
                  onClick={() => addTechStackItem(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <input
            aria-label={field.label}
            className="w-full border-0 bg-transparent p-0 text-sm text-stone-900 outline-none placeholder:text-stone-400"
            value={techStackDraft}
            placeholder="如果上面没有合适项，再手动输入并按回车或逗号"
            onChange={(event) => setTechStackDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === ",") {
                event.preventDefault()
                commitTechStackDraft(techStackDraft)
              }
            }}
            onBlur={() => commitTechStackDraft(techStackDraft)}
          />
        </div>
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
    const requiredFields = category.fields.filter((field) => field.required)
    const optionalFields = category.fields.filter((field) => !field.required)
    const visibleOptionalFields = optionalFields.slice(0, visibleOptionalCounts[category.id])
    const visibleFields = [...requiredFields, ...visibleOptionalFields]
    const hasMoreOptionalFields = visibleOptionalFields.length < optionalFields.length

    return (
      <details key={category.id} className="panel overflow-hidden" open={category.defaultOpen}>
        <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-stone-900">{category.title}</h2>
              {category.fields.some((field) => field.required) ? <span className="tag tag-required">必填</span> : <span className="tag">可选</span>}
            </div>
            <p className="mt-1 max-w-3xl text-sm text-stone-600">{category.description}</p>
          </div>
          <span className="text-xs uppercase tracking-[0.3em] text-stone-400">Expand</span>
        </summary>

        <div className="border-t border-stone-200 px-5 py-5">
          <div className="grid gap-4 md:grid-cols-2">
            {visibleFields.map((field) => (
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

          {hasMoreOptionalFields ? (
            <div className="mt-5">
              <button type="button" className="secondary-button" onClick={() => showMoreFields(category.id)}>
                更多字段（再显示 3 个）
              </button>
            </div>
          ) : null}
        </div>
      </details>
    )
  }

  function renderExtraFieldsPanel() {
    return (
      <section className="panel p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Extra Fields</p>
            <h2 className="mt-2 text-xl font-semibold text-stone-950">可扩展字段</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">这个模块固定在左侧最下方，用来补充默认输入之外的信息。</p>
          </div>
        </div>

        <div className="mt-5 space-y-5">
          <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-stone-900">产品级自定义项</h3>
                <p className="mt-1 text-xs text-stone-600">这些字段面向整个产品，不隶属于任何单独模块。</p>
              </div>
              <button type="button" className="secondary-button" onClick={() => addExtraField()}>
                添加字段
              </button>
            </div>

            {globalExtraFields.length ? (
              <div className="mt-4 space-y-3">
                {globalExtraFields.map((item) => (
                  <div key={item.id} className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-3 md:grid-cols-[0.75fr_1.4fr_auto]">
                    <input
                      className="field"
                      placeholder="名称，如：风险"
                      value={item.label}
                      onChange={(event) => patchExtraField(item.id, "label", event.target.value)}
                    />
                    <input
                      className="field"
                      placeholder="内容，如：用户可能无法接受新的形式"
                      value={item.value}
                      onChange={(event) => patchExtraField(item.id, "value", event.target.value)}
                    />
                    <button type="button" className="ghost-button" onClick={() => removeExtraField(item.id)}>
                      删除
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-stone-500">当前还没有产品级自定义字段。</p>
            )}
          </div>
        </div>
      </section>
    )
  }

  const primaryCategory = categories[0]
  const secondaryCategories = categories.slice(1)
  const visibleSecondaryCategories = secondaryCategories.slice(0, visibleCategoryCount)
  const hasMoreCategories = visibleSecondaryCategories.length < secondaryCategories.length

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="hero-panel">
          <p className="eyebrow">Blueprint Workspace</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
            左侧整理输入，右侧承接 <span className="text-amber-700">分析、问题与文档生成</span>。
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-stone-700">
            提交或更新表单后，系统会自动进行 AI 分析和评分，并提出 3 个关键问题。确认方向后，再在右侧生成 PRD-Lite 或 Scenario 文档。
          </p>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="space-y-4">
            <div className="space-y-4">
              {renderCategory(primaryCategory)}
              {visibleSecondaryCategories.map((category) => renderCategory(category))}
            </div>

            {hasMoreCategories ? (
              <div className="flex justify-center">
                <button type="button" className="secondary-button" onClick={showMoreCategories}>
                  更多模块（再显示 3 个）
                </button>
              </div>
            ) : null}

            <div>
              {renderExtraFieldsPanel()}
            </div>

            <div className="action-bar panel p-5">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="primary-button"
                  disabled={!report.requiredComplete || isAnalysisLoading || isSubmitted}
                  onClick={() => runAnalysis("submit")}
                >
                  {isAnalysisLoading && !isSubmitted ? "提交中..." : "提交"}
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={!report.requiredComplete || isAnalysisLoading || !isSubmitted || !isDirty}
                  onClick={() => runAnalysis("update")}
                >
                  {isAnalysisLoading && isSubmitted ? "更新中..." : "更新"}
                </button>
              </div>
              <p className="mt-3 text-sm text-stone-600">
                提交后自动进行 AI 分析与评分；后续每次修改表单，再点击“更新”刷新右侧结果。
              </p>
            </div>
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
                aria-live="polite"
              >
                <div className="flex items-center gap-3">
                  {requestStatus.kind === "loading" ? (
                    <span className="request-spinner" aria-hidden="true" />
                  ) : requestStatus.kind === "success" ? (
                    <span className="request-indicator request-indicator-success" aria-hidden="true" />
                  ) : requestStatus.kind === "error" ? (
                    <span className="request-indicator request-indicator-error" aria-hidden="true" />
                  ) : (
                    <span className="request-indicator request-indicator-idle" aria-hidden="true" />
                  )}
                  <p className={requestStatus.kind === "loading" ? "font-semibold request-loading-text" : "font-semibold"}>
                    当前状态
                    {requestStatus.kind === "loading" ? <span className="request-ellipsis" aria-hidden="true" /> : null}
                  </p>
                </div>
                <p className="mt-1">{requestStatus.message}</p>
              </div>
              {notice ? <p className="mt-3 text-sm text-amber-700">{notice}</p> : null}
            </section>

            <section className="panel p-5">
              <p className="eyebrow">Analysis</p>
              <h2 className="mt-2 text-xl font-semibold text-stone-950">评分、总结与分析</h2>

              {aiResult ? (
                <div className="mt-4 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-stone-900">评分</h3>
                    <div className={`mt-2 rounded-[1.4rem] border px-4 py-4 text-3xl font-semibold ${scoreTone(aiResult.score)}`}>
                      {normalizeScore(aiResult.score)?.toFixed(0) ?? "-"} / 10
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-stone-900">总结</h3>
                    <div className="doc-viewer mt-2 whitespace-pre-wrap">{formatDisplayValue(aiResult.summary)}</div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-stone-900">分析</h3>
                    <div className="doc-viewer mt-2">
                      <ol className="space-y-2">
                        {(aiResult.keyQuestions.length ? aiResult.keyQuestions : ["AI 暂未返回关键问题。"]).map((item, index) => (
                          <li key={`${index}-${item}`}>{index + 1}. {item}</li>
                        ))}
                      </ol>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-5 text-sm leading-6 text-stone-600">
                  先在左侧填写表单并点击“提交”，右侧会自动出现评分、总结和 3 个分析问题。
                </div>
              )}
            </section>

            <section className="panel p-5">
              <p className="eyebrow">Docs</p>
              <h2 className="mt-2 text-xl font-semibold text-stone-950">生成文档</h2>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="primary-button"
                  disabled={!isSubmitted || !report.requiredComplete || isDocsLoading}
                  onClick={() => generateReviewDoc("prd")}
                >
                  {isDocsLoading && pendingDocType === "prd" ? "生成 PRD-Lite 中..." : "生成 PRD-Lite"}
                </button>
                <button
                  type="button"
                  className="primary-button"
                  disabled={!isSubmitted || !report.requiredComplete || isDocsLoading}
                  onClick={() => generateReviewDoc("scenarios")}
                >
                  {isDocsLoading && pendingDocType === "scenarios" ? "生成 Scenario 中..." : "生成 Scenario"}
                </button>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <button type="button" className={activeDoc === "prd" ? "tab-active" : "tab"} onClick={() => setActiveDoc("prd")}>
                  prd-lite.md
                </button>
                <button type="button" className={activeDoc === "scenarios" ? "tab-active" : "tab"} onClick={() => setActiveDoc("scenarios")}>
                  scenarios.md
                </button>
              </div>

              {activeDocContent ? (
                <pre className="doc-viewer mt-4 whitespace-pre-wrap">{activeDocContent}</pre>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-5 text-sm leading-6 text-stone-600">
                  在右侧点击生成按钮后，这里会显示当前 tab 对应的文档内容。
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" className="secondary-button" disabled={!activeDocContent} onClick={handleCopy}>
                  复制当前文档
                </button>
                <button type="button" className="secondary-button" disabled={!activeDocContent} onClick={handleDownload}>
                  下载当前文档
                </button>
              </div>
            </section>

            <details className="panel p-5">
              <summary className="cursor-pointer text-sm font-semibold text-stone-900">调试详情</summary>
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-stone-900">Analysis Debug</h3>
                  <div className="doc-viewer mt-2 whitespace-pre-wrap">{formatDebugValue(debugState.analysis)}</div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-stone-900">Doc Debug</h3>
                  <div className="doc-viewer mt-2 whitespace-pre-wrap">{formatDebugValue(debugState.doc)}</div>
                </div>
              </div>
            </details>
          </aside>
        </section>
      </div>
    </main>
  )
}
