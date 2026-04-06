import { Meta, StoryObj } from "@storybook/react"
import { withThemeProvider } from "../theme/withThemeProvider"
import { CoinFlipButton } from "../components/CoinFlipButton"

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: "Example/CoinFlip",
  component: withThemeProvider(CoinFlipButton),
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
} satisfies Meta<typeof CoinFlipButton>
export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    children: "Flip Coin",
  },
}
