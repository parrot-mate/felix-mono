import { Meta, StoryObj } from "@storybook/react"
import { MetricDisplay } from "../components"
import { withThemeProvider } from "../theme/withThemeProvider"

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: "Example/MetricDisplay",
  component: withThemeProvider(MetricDisplay),
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
} satisfies Meta<typeof MetricDisplay>
export default meta
type Story = StoryObj<typeof meta>

export const ReadingNum: Story = {
  args: {
    label: "阅读量",
    value: 1000,
  },
}

export const Time: Story = {
  args: {
    label: "时间",
    value: 1000,
    unit: "time",
  },
}
