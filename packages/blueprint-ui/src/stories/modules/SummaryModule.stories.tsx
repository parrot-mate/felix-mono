import type { Meta, StoryObj } from "@storybook/react-vite"
import { BlueprintSummaryModule } from "../../modules/BlueprintSummaryModule"
import { getBlueprintCopy, getStoryLocale } from "../../lib/storyContent"

const meta: Meta<typeof BlueprintSummaryModule> = {
  title: "Modules/Summary Module",
  component: BlueprintSummaryModule,
  tags: ["autodocs"],
  render: (_, context) => {
    const copy = getBlueprintCopy(getStoryLocale(context))
    return (
      <div className="bp-page">
        <BlueprintSummaryModule {...copy.summary} />
      </div>
    )
  },
}

export default meta
type Story = StoryObj<typeof BlueprintSummaryModule>

export const Default: Story = {}
