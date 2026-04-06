import { defineConfig, devices } from "@playwright/test"
import "./scripts/env"

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173"

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: "on-first-retry",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
})
