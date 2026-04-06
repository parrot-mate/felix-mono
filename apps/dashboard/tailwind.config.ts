import theme from "@pmate/theme"
import path from "path"
import type { Config } from "tailwindcss"

const accountSDK = path.resolve(__dirname, "../../packages/account-sdk/src")
export default {
  content: [
    "./dashboard.html",
    "./src/**/*.{ts,tsx,html}",
    "./global.css",
    accountSDK,
  ],
  theme,
  plugins: [],
} satisfies Config
