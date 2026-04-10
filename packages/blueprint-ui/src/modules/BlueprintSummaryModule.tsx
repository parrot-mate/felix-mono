import React from "react"
import { BlueprintPanel } from "../components/BlueprintPanel"

export type BlueprintSuggestion = {
  key: string
  title: string
  reason: string
  ctaLabel?: string
  onClick?: () => void
}

export type BlueprintSummaryModuleProps = {
  structuredScore: number
  summary: string
  keyQuestions: string[]
  suggestions: BlueprintSuggestion[]
}

export function BlueprintSummaryModule({
  structuredScore,
  summary,
  keyQuestions,
  suggestions,
}: BlueprintSummaryModuleProps) {
  return (
    <div className="bp-stack">
      <div className="bp-score">
        <p className="bp-eyebrow">Structured Input</p>
        <p className="bp-score__value">{structuredScore} / 10</p>
        <p className="bp-panel__meta">当前表单完整度评分</p>
      </div>

      <BlueprintPanel title="AI Draft 摘要">
        <p className="bp-panel__meta">{summary}</p>
      </BlueprintPanel>

      <BlueprintPanel title="AI Draft 关键问题">
        <ol className="bp-list">
          {keyQuestions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </BlueprintPanel>

      <BlueprintPanel eyebrow="Structured Input" title="结构化输入建议">
        <div className="bp-stack bp-stack--sm">
          {suggestions.map((item) => (
            <div className="bp-section-card" key={item.key}>
              <div className="bp-row">
                <div>
                  <p className="bp-panel__title">{item.title}</p>
                  <p className="bp-panel__meta">{item.reason}</p>
                </div>
                {item.onClick ? (
                  <button type="button" className="bp-doc-tab" onClick={item.onClick}>
                    {item.ctaLabel ?? "去补充"}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </BlueprintPanel>
    </div>
  )
}
