import type { Meta, StoryObj } from "@storybook/react-vite"
import { BlueprintWorkspacePage } from "../../pages/BlueprintWorkspacePage"
import { getBlueprintCopy, getStoryLocale } from "../../lib/storyContent"

const meta: Meta<typeof BlueprintWorkspacePage> = {
  title: "Design Principles/Overview",
  component: BlueprintWorkspacePage,
  tags: ["autodocs"],
  render: (_, context) => {
    const copy = getBlueprintCopy(getStoryLocale(context))
    return (
      <BlueprintWorkspacePage
        eyebrow={copy.heroEyebrow}
        title={copy.heroTitle}
        subtitle={copy.heroSubtitle}
        isDesktop={context.globals.platform !== "mobile"}
        stages={copy.stages}
        sections={copy.sections}
        summary={copy.summary}
        reviewDocs={copy.reviewDocs}
        formalDocs={copy.formalDocs}
      />
    )
  },
}

export default meta
type Story = StoryObj<typeof BlueprintWorkspacePage>

export const Playground: Story = {}
