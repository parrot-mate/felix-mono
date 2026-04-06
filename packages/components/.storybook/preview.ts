import type { Preview } from "@storybook/react"
import { ThemeProvider } from ".."
import "../src/style/font.css"


const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
}

export default preview
