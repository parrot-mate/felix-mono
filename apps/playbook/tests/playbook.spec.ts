import { expect, test } from "@playwright/test"

test("users can browse a capability and inspect its related details", async ({ page }) => {
  await page.goto("/")
  const detailPanel = page.getByLabel("Detail panel")

  await expect(page.getByRole("heading", { name: "PMate Playbook" })).toBeVisible()
  await expect(page.getByLabel("Workspace tree")).toBeVisible()
  await page.getByRole("button", { name: /pmate-skills/ }).click()

  await expect(detailPanel.getByRole("heading", { name: "pmate-skills" })).toBeVisible()
  await expect(detailPanel.locator(".mono-text")).toHaveText("pmate/pmate-skills")
  await expect(detailPanel.getByText(/skills 与 agent 工作流仓库/)).toBeVisible()
})

test("workspace tree links can switch the detail panel", async ({ page }) => {
  await page.goto("/")
  const detailPanel = page.getByLabel("Detail panel")

  await page.getByRole("button", { name: /pmate-cli.*CLI and workflow entry/i }).click()
  await expect(detailPanel.getByRole("heading", { name: "pmate-cli" })).toBeVisible()
})

test("search narrows the list and no-result state is explicit", async ({ page }) => {
  await page.goto("/")

  await page.getByLabel("Search").fill("static site")
  await expect(page.getByRole("button", { name: /pmate-static/ })).toBeVisible()

  await page.getByLabel("Search").fill("missing capability")
  await expect(page.getByRole("status")).toContainText("No matching modules")
})

test("related capability links can move the user through the map", async ({ page }) => {
  await page.goto("/")
  const detailPanel = page.getByLabel("Detail panel")

  await page.getByRole("button", { name: /pmate-proposal/ }).nth(0).click()
  await detailPanel.getByRole("button", { name: /pmate-mono/ }).click()

  await expect(detailPanel.getByRole("heading", { name: "pmate-mono" })).toBeVisible()
  await expect(detailPanel.getByText(/主 monorepo/)).toBeVisible()
})
