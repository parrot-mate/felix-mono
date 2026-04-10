import type { Meta, StoryObj } from "@storybook/react-vite"
import { BlueprintStageCard } from "../../components/BlueprintStageCard"

const meta: Meta<typeof BlueprintStageCard> = {
  title: "Components/Stage Card",
  component: BlueprintStageCard,
  tags: ["autodocs"],
  args: {
    title: "阶段 2 AI 分析",
    description: "显示摘要、关键问题和建议补充信息。",
    status: "可触发",
  },
}

export default meta
type Story = StoryObj<typeof BlueprintStageCard>

export const Default: Story = {}
