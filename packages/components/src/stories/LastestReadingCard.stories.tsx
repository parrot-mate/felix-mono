import { Meta, StoryObj } from "@storybook/react"
import { withThemeProvider } from "../theme/withThemeProvider"
import { LatestReadingCard } from "../components/LastestReadingCard"

const Comp = withThemeProvider(LatestReadingCard)
// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: "Example/LatestReadingCard",
  component: Comp,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: "centered",
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ["autodocs"],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    // backgroundColor: { control: "color" },
  },
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: {},
} satisfies Meta<typeof LatestReadingCard>
export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    cover:
      "https://book.skedo.cn/covers-v2/b037f96166c1ae02fce9af657815b4efea324191.webp",
    pageNo: 10,
    title: "The Wonderful Wizard of Oz",
  },
}
