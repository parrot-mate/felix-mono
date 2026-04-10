import type { Meta, StoryObj } from "@storybook/react-vite"
import React from "react"
import { BlueprintPanel } from "../../components/BlueprintPanel"
import { getBlueprintCopy, getStoryLocale } from "../../lib/storyContent"

const meta: Meta<typeof BlueprintPanel> = {
  title: "Design Principles/Guidelines",
  component: BlueprintPanel,
  tags: ["autodocs"],
  render: (_, context) => {
    const copy = getBlueprintCopy(getStoryLocale(context))
    return (
      <div className="bp-page bp-page--desktop">
        <BlueprintPanel
          eyebrow="Design Principles"
          title={getStoryLocale(context) === "en" ? "Blueprint UI Library Rules" : "Blueprint UI 库原则"}
          description={getStoryLocale(context) === "en" ? "Use the package like auth-widgets: pure UI here, orchestration in the app." : "参考 auth-widgets：这里放纯 UI，业务编排留在 app。"}
        >
          <ol className="bp-list">
            {copy.principles.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </BlueprintPanel>
      </div>
    )
  },
}

export default meta
type Story = StoryObj<typeof BlueprintPanel>

export const Default: Story = {}
