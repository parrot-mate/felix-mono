import { Meta, StoryObj } from "@storybook/react"
import { withThemeProvider } from "../theme/withThemeProvider"
import { VisualLine } from "../components/reader/VisualLine"
import { Box } from "@mui/material"
import React from "react"

const Comp = withThemeProvider(VisualLine)
// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: "Example/VisualLine",
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
} satisfies Meta<typeof VisualLine>
export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {},
  render: () => (
    <Box
      sx={{
        height: "500px",
        width: "200px",
      }}
    >
      <Comp />
    </Box>
  ),
}
