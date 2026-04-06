import { expect, test } from "@playwright/test"

test("homepage renders and search filters results", async ({ page }) => {
  await page.goto("/?mockAuth=1&name=Nina&businessRole=employee&department=ops")

  await expect(page.getByText("Townhall Workspace")).toBeVisible()
  await expect(page.getByText("审批中心")).toBeVisible()
  await expect(page.getByText("销售 CRM")).toHaveCount(0)

  await page.getByLabel("Search").fill("知识")
  await expect(page.getByText("知识库")).toBeVisible()
  await expect(page.getByText("审批中心")).toHaveCount(0)
})

test("manager in sales can see sales crm", async ({ page }) => {
  await page.goto("/?mockAuth=1&name=May&businessRole=manager&department=sales")

  await expect(page.getByText("销售 CRM")).toBeVisible()
})

test("admin can create a navigation item that appears on homepage", async ({ page }) => {
  await page.goto("/admin?mockAuth=1&name=May&businessRole=manager&department=sales")

  await expect(page.getByText("审批中心")).toBeVisible()
  await page.getByRole("button", { name: "新增导航项" }).click()
  await page.getByLabel("名称").fill("合同中心")
  await page.getByLabel("分组").fill("业务系统")
  await page.getByLabel("描述").fill("合同审批与模板下载。")
  await page.getByLabel("目标链接").fill("https://contracts.example.com")
  await page.getByLabel("图标缩写").fill("CT")
  await page.getByLabel("可见角色").fill("manager")
  await page.getByLabel("可见部门").fill("sales")
  await page.getByRole("button", { name: "保存" }).click()
  await expect(page.getByText("合同中心")).toBeVisible()

  await page.getByRole("link", { name: "首页" }).click()
  await expect(page.getByText("合同中心")).toBeVisible()
})
