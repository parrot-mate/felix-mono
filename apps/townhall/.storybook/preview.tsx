import type { Preview } from "@storybook/react-vite"
import React from "react"
import "../src/styles.css"

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
    backgrounds: {
      default: "night",
      values: [
        { name: "night", value: "#090312" },
        { name: "violet", value: "#14061d" },
      ],
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ padding: "1rem" }}>
        <Story />
      </div>
    ),
  ],
}

export default preview
