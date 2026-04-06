import theme from "@pmate/theme"
import path from "path"
import type { Config } from "tailwindcss"

const accountSDK = path.resolve(__dirname, "../../packages/account-sdk/src")
const sdk = path.resolve(__dirname, "../../packages/sdk/src")

export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,html}",
    "./global.css",
    accountSDK,
    sdk,
  ],
  theme,
  plugins: [],
} satisfies Config
