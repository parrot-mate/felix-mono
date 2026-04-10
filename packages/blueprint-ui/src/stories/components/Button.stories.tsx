import type { Meta, StoryObj } from "@storybook/react-vite"
import React from "react"
import { BlueprintButton } from "../../components/BlueprintButton"

const meta: Meta<typeof BlueprintButton> = {
  title: "Components/Button",
  component: BlueprintButton,
  tags: ["autodocs"],
  render: () => (
    <div className="bp-page">
      <div className="bp-actions">
        <BlueprintButton>Primary</BlueprintButton>
        <BlueprintButton variant="secondary">Secondary</BlueprintButton>
        <BlueprintButton variant="ghost">Ghost</BlueprintButton>
        <BlueprintButton disabled>Disabled</BlueprintButton>
      </div>
    </div>
  ),
}

export default meta
type Story = StoryObj<typeof BlueprintButton>

export const Variants: Story = {}
