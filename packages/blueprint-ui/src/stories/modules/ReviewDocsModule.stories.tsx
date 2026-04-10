import type { Meta, StoryObj } from "@storybook/react-vite"
import { BlueprintDocActionsModule } from "../../modules/BlueprintDocActionsModule"
import { getBlueprintCopy, getStoryLocale } from "../../lib/storyContent"

const meta: Meta<typeof BlueprintDocActionsModule> = {
  title: "Modules/Doc Actions",
  component: BlueprintDocActionsModule,
  tags: ["autodocs"],
  render: (_, context) => {
    const copy = getBlueprintCopy(getStoryLocale(context))
    return (
      <div className="bp-page">
        <BlueprintDocActionsModule {...copy.reviewDocs} />
      </div>
    )
  },
}

export default meta
type Story = StoryObj<typeof BlueprintDocActionsModule>

export const ReviewDocs: Story = {}
