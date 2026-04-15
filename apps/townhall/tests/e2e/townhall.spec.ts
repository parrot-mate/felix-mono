import { expect, test } from "@playwright/test"

const productRows = [
  {
    createdAt: 1775057960042,
    createdBy: "0x86c65e16a1b3b8982d1f4d7e7721849dd55f4ef1880fed897cccb2a770095258",
    description: "统一产品门户。",
    docUrl: "https://townhall.pmate.chat/",
    group: "协作工具",
    icon: "TH",
    id: "nav-townhall",
    name: "TownHall",
    openMode: "same-tab",
    owner: "PMate Team",
    status: "active",
    tags: ["TH", "same-tab", "协作工具"],
    team: "协作工具",
    updatedAt: 1775057960042,
    updatedBy: "0x86c65e16a1b3b8982d1f4d7e7721849dd55f4ef1880fed897cccb2a770095258",
    url: "https://townhall.pmate.chat/",
  },
  {
    createdAt: 1775461469620,
    createdBy: "0x86c65e16a1b3b8982d1f4d7e7721849dd55f4ef1880fed897cccb2a770095258",
    description: "文档阅读与 chunk 打包工作台。",
    docUrl: "https://reader.pmate.chat/",
    group: "知识工具",
    icon: "RD",
    id: "nav-reader",
    name: "Reader",
    openMode: "new-tab",
    owner: "Reader Ops",
    status: "beta",
    tags: ["RD", "new-tab", "知识工具"],
    team: "知识工具",
    updatedAt: 1775461469620,
    updatedBy: "0x86c65e16a1b3b8982d1f4d7e7721849dd55f4ef1880fed897cccb2a770095258",
    url: "https://reader.pmate.chat/",
  },
]

test.beforeEach(async ({ page }) => {
  let currentRows = [...productRows]

  await page.route("https://qaidx.pmate.chat/chains/pmate-test/namespaces/pmate/table/erp-homepage-nav/page?page_id=0", async (route) => {
    await route.fulfill({
      json: {
        success: true,
        message: "ok",
        data: {
          data: currentRows,
          page: 0,
          pageSize: 100,
          totalPage: 1,
        },
      },
    })
  })

  await page.route("https://qaidx.pmate.chat/chains/pmate-test/namespaces/pmate/table/erp-homepage-nav/exists*", async (route) => {
    const url = new URL(route.request().url())
    const id = url.searchParams.get("id")
    await route.fulfill({
      json: {
        success: true,
        message: "ok",
        data: currentRows.some((row) => row.id === id),
      },
    })
  })

  await page.route("https://qaidx.pmate.chat/chains/pmate-test/namespaces/pmate/table/erp-homepage-nav/get_by_id*", async (route) => {
    const url = new URL(route.request().url())
    const id = url.searchParams.get("id")
    await route.fulfill({
      json: {
        success: true,
        message: "ok",
        data: currentRows.find((row) => row.id === id) ?? null,
      },
    })
  })

  await page.route("https://qablk01.pmate.chat/chains/pmate-test/logs", async (route) => {
    const payload = route.request().postDataJSON() as {
      logs?: Array<{
        data?: {
          type?: "create" | "update" | "delete"
          after?: Record<string, unknown>
          id?: string
          value?: Record<string, unknown>
        }
      }>
    }
    for (const log of payload.logs ?? []) {
      if (log.data?.type === "create" && log.data.after) {
        currentRows = [
          {
            ...(log.data.after as typeof productRows[number]),
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          ...currentRows,
        ]
      }
      if (log.data?.type === "update" && log.data.id) {
        currentRows = currentRows.map((row) =>
          row.id === log.data?.id
            ? {
                ...row,
                ...(log.data.value as Partial<typeof row>),
                updatedAt: Date.now(),
              }
            : row,
        )
      }
      if (log.data?.type === "delete" && log.data.id) {
        currentRows = currentRows.filter((row) => row.id !== log.data?.id)
      }
    }
    await route.fulfill({
      json: {
        success: true,
        message: "ok",
        data: null,
      },
    })
  })
})

test("users can browse the portal and inspect a product", async ({ page }) => {
  await page.goto("/")

  await expect(page.getByRole("heading", { level: 1, name: "TownHall" })).toBeVisible()
  await page.getByLabel("搜索").fill("reader")
  await page.getByRole("button", { name: /Reader/ }).click()

  const detailPanel = page.getByLabel("产品详情面板")
  await expect(detailPanel.getByRole("heading", { name: "Reader" })).toBeVisible()
  await expect(detailPanel.getByText(/chunk 打包工作台/)).toBeVisible()
})

test("users can add a product from the management view", async ({ page }) => {
  await page.goto("/")

  await page.getByRole("button", { name: "管理", exact: true }).click()
  await page.getByLabel("名称").fill("Agent Hub")
  await page.getByLabel("负责人").fill("AI Platform")
  await page.getByLabel("团队").fill("Agent Infra")
  await page.getByLabel("分类").fill("Workflow")
  await page.getByRole("textbox", { name: "标签" }).fill("agent, featured")
  await page.getByLabel("状态").selectOption("beta")
  await page.getByLabel("图标").fill("AH")
  await page.getByLabel("打开方式").selectOption("new-tab")
  await page.getByLabel("简介").fill("统一管理 agent 注册、上下文与执行入口。")
  await page.getByLabel("入口链接").fill("https://agenthub.pmate.chat/")
  await page.getByLabel("文档链接").fill("https://agenthub.pmate.chat/docs")
  await page.getByRole("button", { name: "创建产品" }).click()

  await expect(page.getByLabel("产品详情面板").getByRole("heading", { name: "Agent Hub" })).toBeVisible()
})
