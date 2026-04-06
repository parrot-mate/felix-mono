import { Meta, StoryObj } from "@storybook/react"
import { PunchEgg } from "../components"
import { withThemeProvider } from "../theme/withThemeProvider"

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: "Example/PunchEgg",
  component: withThemeProvider(PunchEgg),
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
} satisfies Meta<typeof PunchEgg>
export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    text: "打卡",
    active: true,
    disabled: false,
    wordCount: 1000,
    timeInSecond: 100000,
    reviewed: 100,
    newWords: 180,
  },
}

export const Mobile: Story = {
  args: {
    sx: {
      width: "375px",
    },
    text: "去打卡&领取",
    active: true,
    disabled: false,
    wordCount: 1000,
    timeInSecond: 100000,
    reviewed: 100,
    newWords: 180,
  },
}

export const Mobile320: Story = {
  args: {
    sx: {
      width: "320px",
    },
    text: "打卡！！！",
    active: true,
    disabled: false,
    wordCount: 1000,
    timeInSecond: 100000,
    reviewed: 100,
    newWords: 180,
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    text: "已完成",
    active: true,
    wordCount: 1000,
    timeInSecond: 100000,
    reviewed: 100,
    newWords: 180,
  },
}
