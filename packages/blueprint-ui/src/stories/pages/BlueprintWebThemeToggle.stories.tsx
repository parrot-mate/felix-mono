import type { Meta, StoryObj } from "@storybook/react-vite"
import React, { useEffect, useState } from "react"
import { BlueprintButton } from "../../components/BlueprintButton"
import { BlueprintPanel } from "../../components/BlueprintPanel"
import { BlueprintStageCard } from "../../components/BlueprintStageCard"
import "../../../../../apps/blueprint-web/src/styles.css"

type ColorMode = "dark" | "light"

function ThemeTogglePreview({ initialMode = "dark" }: { initialMode?: ColorMode }) {
  const [colorMode, setColorMode] = useState<ColorMode>(initialMode)

  useEffect(() => {
    setColorMode(initialMode)
  }, [initialMode])

  useEffect(() => {
    document.body.dataset.bpColorMode = colorMode
    document.documentElement.style.colorScheme = colorMode

    return () => {
      delete document.body.dataset.bpColorMode
      document.documentElement.style.colorScheme = "dark"
    }
  }, [colorMode])

  return (
    <main className="bp-page bp-page--desktop bp-web" data-bp-theme="together-blueprint" data-bp-color-mode={colorMode}>
      <section className="bp-hero">
        <div className="bp-hero__content">
          <div className="bp-hero-wordmark">Blueprint</div>
          <p className="bp-hero-subtitle">在 Storybook 中直接预览 blueprint-web 的白天 / 黑夜模式切换效果。</p>
        </div>
        <button
          type="button"
          className="bp-theme-toggle"
          aria-label={colorMode === "dark" ? "切换到白天模式" : "切换到黑夜模式"}
          aria-pressed={colorMode === "light"}
          onClick={() => setColorMode((current) => (current === "dark" ? "light" : "dark"))}
        >
          {colorMode === "dark" ? (
            <svg viewBox="0 0 24 24" aria-hidden="true" className="bp-theme-toggle__icon">
              <path
                d="M12 3.75V2m0 20v-1.75M5.636 5.636 4.393 4.393m15.214 15.214-1.243-1.243M3.75 12H2m20 0h-1.75M5.636 18.364l-1.243 1.243m15.214-15.214-1.243 1.243M12 16.25A4.25 4.25 0 1 0 12 7.75a4.25 4.25 0 0 0 0 8.5Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true" className="bp-theme-toggle__icon">
              <path
                d="M14.906 3.2a1 1 0 0 1 .96 1.275 7.25 7.25 0 1 0 8.659 8.659 1 1 0 0 1 1.275.96A10.25 10.25 0 1 1 14.906 3.2Z"
                fill="currentColor"
              />
            </svg>
          )}
        </button>
      </section>

      <section className="bp-grid bp-grid--stages">
        <BlueprintStageCard
          title="阶段 1 结构化输入"
          description="白天模式下继续保留层级、边框和状态可读性。"
          status={colorMode === "dark" ? "黑夜模式" : "白天模式"}
          active
        />
        <BlueprintStageCard
          title="阶段 2 AI 分析"
          description="卡片亮面、文字对比和 hover 反馈都需要同步切换。"
          status="可预览"
        />
        <BlueprintStageCard
          title="阶段 3 Review Docs"
          description="右上角按钮应始终固定在 hero 最右侧。"
          status="已接入"
        />
      </section>

      <section className="bp-stage-layout bp-stage-layout--analysis">
        <div className="bp-stage-layout__main bp-stack">
          <BlueprintPanel
            eyebrow="Theme Preview"
            title="页面级日夜切换"
            description="这个 story 使用 blueprint-web 的真实样式覆盖，方便直接观察背景、面板和正文的整体变化。"
          >
            <div className="bp-request bp-request--success">
              当前模式：{colorMode === "dark" ? "黑夜模式" : "白天模式"}。点击右上角 icon 按钮即可切换。
            </div>
          </BlueprintPanel>

          <BlueprintPanel title="文档预览区域" description="验证大面积内容容器在白底下是否仍然有足够边界感。">
            <div className="bp-doc-viewer">
              <div className="bp-markdown">
                <h2 className="bp-markdown__h2">Day Mode Review</h2>
                <p className="bp-markdown__p">
                  白天模式需要保留 Blueprint 现有的信息密度，同时降低长时间阅读时的视觉压迫感。
                </p>
                <p className="bp-markdown__p">
                  重点观察背景、卡片边框、按钮、正文文字和代码预览区域的对比关系是否稳定。
                </p>
              </div>
            </div>
          </BlueprintPanel>
        </div>

        <aside className="bp-stage-layout__side bp-stack">
          <BlueprintPanel title="操作区" description="辅助检查按钮、边框和阴影在浅色主题下的质感。">
            <div className="bp-actions">
              <BlueprintButton>主操作</BlueprintButton>
              <BlueprintButton variant="secondary">次要操作</BlueprintButton>
              <BlueprintButton variant="ghost">Ghost</BlueprintButton>
            </div>
          </BlueprintPanel>
        </aside>
      </section>
    </main>
  )
}

const meta: Meta<typeof ThemeTogglePreview> = {
  title: "Pages/Blueprint Web Theme Toggle",
  component: ThemeTogglePreview,
  tags: ["autodocs"],
  args: {
    initialMode: "dark",
  },
  argTypes: {
    initialMode: {
      control: "inline-radio",
      options: ["dark", "light"],
    },
  },
}

export default meta
type Story = StoryObj<typeof ThemeTogglePreview>

export const Preview: Story = {}

export const LightMode: Story = {
  args: {
    initialMode: "light",
  },
}
