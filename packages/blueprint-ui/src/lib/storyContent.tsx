import React from "react"
import { blueprintThemes } from "../tokens/themes"

export type SupportedLocale = "zh-CN" | "en"

export function getBlueprintCopy(locale: SupportedLocale) {
  if (locale === "en") {
    return {
      heroEyebrow: "Blueprint UI Kit",
      heroTitle: "Structured product input, visible AI runtime, reviewable specs.",
      heroSubtitle:
        "A stateless UI library for future Blueprint flows. It separates design tokens, components, modules, and pages from app-specific agent orchestration.",
      stages: [
        { title: "Stage 1 Input", description: "Capture structured scope and constraints.", status: "Editing" },
        { title: "Stage 2 AI Analysis", description: "Show summary, key questions, and status.", status: "Ready" },
        { title: "Stage 3 Review Docs", description: "Generate reviewable markdown drafts.", status: "Pending" },
        { title: "Stage 4 Formal Specs", description: "Prepare product, develop, QA, and deploy docs.", status: "Locked" },
      ],
      sections: [
        {
          id: "basics",
          title: "Basics",
          description: "The minimum required context before AI is allowed to run.",
          fields: [
            { id: "productName", label: "Product Name", value: "Blueprint Workspace", readOnly: true },
            { id: "productGoal", label: "Product Goal", value: "Turn rough ideas into reviewable specs.", readOnly: true },
            { id: "background", label: "Background", value: "Teams need clearer product inputs before doc generation.", kind: "textarea" as const, readOnly: true },
          ],
        },
        {
          id: "users",
          title: "Users and Scenarios",
          description: "Clarify target users, current workflow, and usage context.",
          fields: [
            { id: "targetUsers", label: "Target Users", value: "Product managers\nIndie builders", kind: "textarea" as const, readOnly: true },
            { id: "usageScenarios", label: "Usage Scenarios", value: "Requirement kickoff\nSpec refinement", kind: "textarea" as const, readOnly: true },
          ],
        },
      ],
      summary: {
        structuredScore: 8,
        summary:
          "Blueprint organizes structured product input, then lets users review visible AI output before moving into docs.",
        keyQuestions: [
          "Which fields are mandatory before AI can run?",
          "How should users compare structured input and AI draft?",
          "What signals indicate the AI run is real and not cached?",
        ],
        suggestions: [
          {
            key: "constraints",
            title: "Add missing constraints",
            reason: "Platform limits and technical limits are still shallow.",
          },
          {
            key: "success",
            title: "Clarify success criteria",
            reason: "The page should show what counts as a good generated result.",
          },
        ],
      },
      reviewDocs: {
        title: "Review Docs",
        actions: [
          { key: "prdLite", label: "Generate PRD-Lite" },
          { key: "scenarios", label: "Generate Scenarios" },
          { key: "decisions", label: "Generate Decisions" },
          { key: "deliveryPlan", label: "Generate Delivery Plan" },
        ],
        files: [
          { key: "prdLite", label: "prd-lite.md" },
          { key: "scenarios", label: "scenarios.md" },
          { key: "decisions", label: "decisions.md" },
          { key: "deliveryPlan", label: "delivery-plan.md" },
        ],
        activeFile: "prdLite",
      },
      formalDocs: {
        title: "Formal Specs",
        actions: [
          { key: "product", label: "Generate product.md" },
          { key: "develop", label: "Generate develop.md" },
          { key: "qa", label: "Generate qa.md" },
          { key: "deploy", label: "Generate deploy.md" },
        ],
        files: [
          { key: "product", label: "product.md" },
          { key: "develop", label: "develop.md" },
          { key: "qa", label: "qa.md" },
          { key: "deploy", label: "deploy.md" },
        ],
        activeFile: "develop",
      },
      principles: [
        "Keep components stateless. Business orchestration stays in the app layer.",
        "Expose device, theme, and language directly from Storybook toolbar.",
        "Separate tokens, components, modules, and pages so teams can adopt gradually.",
        "Offer multiple visual themes instead of forcing one default aesthetic.",
      ],
    }
  }

  return {
    heroEyebrow: "Blueprint UI Kit",
    heroTitle: "结构化输入、可见 AI 运行态、可 review 规格稿。",
    heroSubtitle:
      "这是一套给 Blueprint 后续演进准备的无业务状态 UI 库，把设计 Tokens、组件、模块和页面骨架从具体 agent 编排里拆出来。",
    stages: [
      { title: "阶段 1 结构化输入", description: "先收集范围、约束和背景。", status: "编辑中" },
      { title: "阶段 2 AI 分析", description: "展示摘要、关键问题和运行态。", status: "可触发" },
      { title: "阶段 3 Review Docs", description: "生成可 review 的 Markdown 初稿。", status: "待生成" },
      { title: "阶段 4 Formal Specs", description: "产出 product / develop / qa / deploy。", status: "未解锁" },
    ],
    sections: [
      {
        id: "basics",
        title: "基础信息",
        description: "这是 agent 运行前必须补齐的最小上下文。",
        fields: [
          { id: "productName", label: "产品名称", value: "Blueprint Workspace", readOnly: true },
          { id: "productGoal", label: "产品目标", value: "把模糊需求变成可 review 的规格稿。", readOnly: true },
          { id: "background", label: "背景", value: "团队在文档生成前，需要更稳定的输入与可感知的 AI 交互。", kind: "textarea" as const, readOnly: true },
        ],
      },
      {
        id: "users",
        title: "用户与场景",
        description: "澄清谁在用、怎么用、当前痛点是什么。",
        fields: [
          { id: "targetUsers", label: "目标用户", value: "产品经理\n独立开发者", kind: "textarea" as const, readOnly: true },
          { id: "usageScenarios", label: "使用场景", value: "需求 Kickoff\n规格细化", kind: "textarea" as const, readOnly: true },
        ],
      },
    ],
    summary: {
      structuredScore: 8,
      summary:
        "Blueprint 先整理结构化输入，再把 AI 输出放到前台，让用户在进入文档阶段前可见、可比、可确认。",
      keyQuestions: [
        "哪些字段必须补齐后才允许触发 AI？",
        "结构化输入和 AI 稿如何在页面上清晰区分？",
        "怎样让用户确信这次真的触发了 agent 而不是缓存？",
      ],
      suggestions: [
        {
          key: "constraints",
          title: "补充约束条件",
          reason: "平台限制和技术限制还不够完整，容易影响后续实现建议。",
        },
        {
          key: "success",
          title: "补充成功标准",
          reason: "页面需要更明确地表达什么样的输出算高质量结果。",
        },
      ],
    },
    reviewDocs: {
      title: "Review Docs",
      actions: [
        { key: "prdLite", label: "生成 PRD-Lite" },
        { key: "scenarios", label: "生成 Scenario" },
        { key: "decisions", label: "生成 Decisions" },
        { key: "deliveryPlan", label: "生成 Delivery Plan" },
      ],
      files: [
        { key: "prdLite", label: "prd-lite.md" },
        { key: "scenarios", label: "scenarios.md" },
        { key: "decisions", label: "decisions.md" },
        { key: "deliveryPlan", label: "delivery-plan.md" },
      ],
      activeFile: "prdLite",
    },
    formalDocs: {
      title: "Formal Specs",
      actions: [
        { key: "product", label: "生成 product.md" },
        { key: "develop", label: "生成 develop.md" },
        { key: "qa", label: "生成 qa.md" },
        { key: "deploy", label: "生成 deploy.md" },
      ],
      files: [
        { key: "product", label: "product.md" },
        { key: "develop", label: "develop.md" },
        { key: "qa", label: "qa.md" },
        { key: "deploy", label: "deploy.md" },
      ],
      activeFile: "develop",
    },
    principles: [
      "组件全部保持无业务状态，agent 编排和接口调用仍放在 app 层。",
      "Storybook 顶栏直接切语言、主题和端，评审时不需要改代码。",
      "目录按 Design Principles、Tokens、Components、Modules、Pages 分层，便于渐进迁移。",
      "至少提供多套主题，让团队在需求工具感和品牌感之间可切换。",
    ],
  }
}

export function getStoryLocale(context: { globals?: Record<string, unknown> }) {
  const locale = context.globals?.locale
  return locale === "en" ? "en" : "zh-CN"
}

export function ThemeTokenShowcase() {
  return (
    <div className="bp-token-grid">
      {blueprintThemes.map((theme) => (
        <div className="bp-token-card" key={theme.id}>
          <div className="bp-token-swatch" style={{ background: `var(--bp-primary)` }} />
          <p className="bp-panel__title" style={{ marginTop: 14 }}>
            {theme.name}
          </p>
          <p className="bp-panel__meta">{theme.summary}</p>
        </div>
      ))}
    </div>
  )
}
