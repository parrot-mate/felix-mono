import React from "react"
import { BlueprintButton } from "../components/BlueprintButton"
import { BlueprintField } from "../components/BlueprintField"
import { BlueprintPanel } from "../components/BlueprintPanel"
import { BlueprintStageCard, type BlueprintStageCardProps } from "../components/BlueprintStageCard"
import { BlueprintDocActionsModule, type BlueprintDocActionsModuleProps } from "../modules/BlueprintDocActionsModule"
import { BlueprintSummaryModule, type BlueprintSummaryModuleProps } from "../modules/BlueprintSummaryModule"

export type BlueprintWorkspaceSection = {
  id: string
  title: string
  description: string
  fields: Array<{
    id: string
    label: string
    hint?: string
    placeholder?: string
    kind?: "text" | "textarea" | "select"
    multiline?: boolean
    options?: Array<{ value: string; label: string }>
    required?: boolean
    readOnly?: boolean
    value?: string
    onChange?: (value: string) => void
  }>
}

export type BlueprintWorkspacePageProps = {
  eyebrow: string
  title: string
  subtitle: string
  isDesktop?: boolean
  stages: BlueprintStageCardProps[]
  sections: BlueprintWorkspaceSection[]
  summary: BlueprintSummaryModuleProps
  reviewDocs: BlueprintDocActionsModuleProps
  formalDocs: BlueprintDocActionsModuleProps
}

export function BlueprintWorkspacePage({
  eyebrow,
  title,
  subtitle,
  isDesktop = true,
  stages,
  sections,
  summary,
  reviewDocs,
  formalDocs,
}: BlueprintWorkspacePageProps) {
  return (
    <main className={isDesktop ? "bp-page bp-page--desktop" : "bp-page"}>
      <div className="bp-stack">
        <section className="bp-hero">
          <p className="bp-eyebrow">{eyebrow}</p>
          <h1 className="bp-title">{title}</h1>
          <p className="bp-subtitle">{subtitle}</p>
        </section>

        <section className="bp-grid bp-grid--stages">
          {stages.map((item) => (
            <BlueprintStageCard key={item.title} {...item} />
          ))}
        </section>

        <section className="bp-grid bp-grid--main">
          <div className="bp-stack">
            <BlueprintPanel
              title="关键字段录入"
              description="先收集完整的结构化输入，再触发后续 AI 派生。"
            >
              <div className="bp-stack">
                {sections.map((section) => (
                  <div className="bp-section-card" key={section.id}>
                    <p className="bp-panel__title">{section.title}</p>
                    <p className="bp-panel__meta">{section.description}</p>
                    <div style={{ height: 16 }} />
                    <div className="bp-stack">
                      {section.fields.map((field) => (
                        <BlueprintField key={field.id} {...field} />
                      ))}
                    </div>
                  </div>
                ))}
                <div className="bp-actions">
                  <BlueprintButton>提交结构化输入</BlueprintButton>
                  <BlueprintButton variant="secondary">保存草稿</BlueprintButton>
                </div>
              </div>
            </BlueprintPanel>
          </div>

          <aside className="bp-stack">
            <div className="bp-status bp-status--success">
              前端已直连 agent，当前可以继续生成摘要、Review Docs 和 Formal Specs。
            </div>
            <BlueprintSummaryModule {...summary} />
            <BlueprintDocActionsModule {...reviewDocs} />
            <BlueprintDocActionsModule {...formalDocs} />
          </aside>
        </section>
      </div>
    </main>
  )
}
