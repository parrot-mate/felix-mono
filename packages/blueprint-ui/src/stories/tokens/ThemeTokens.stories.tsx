import type { Meta, StoryObj } from "@storybook/react-vite"
import React from "react"
import { BlueprintPanel } from "../../components/BlueprintPanel"
import { ThemeTokenShowcase, getStoryLocale } from "../../lib/storyContent"

const meta: Meta<typeof BlueprintPanel> = {
  title: "Tokens/Themes",
  component: BlueprintPanel,
  tags: ["autodocs"],
  render: (_, context) => (
    <div className="bp-page bp-page--desktop">
      <BlueprintPanel
        eyebrow="Tokens"
        title={getStoryLocale(context) === "en" ? "Theme Families" : "主题家族"}
        description={
          getStoryLocale(context) === "en"
            ? "Switch themes from the toolbar to evaluate tone, contrast, and information hierarchy."
            : "用顶栏切主题，评估语气、对比度和信息层级。"
        }
      >
        <ThemeTokenShowcase />
      </BlueprintPanel>
    </div>
  ),
}

export default meta
type Story = StoryObj<typeof BlueprintPanel>

export const Themes: Story = {}
