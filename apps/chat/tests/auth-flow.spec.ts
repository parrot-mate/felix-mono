import { expect, test } from "@playwright/test"

const AUTH_BASE_URL =
  process.env.AUTH_API_BASE_URL ?? "https://auth-api-v2.pmate.chat"
const APP_ID = process.env.PMATE_APP_ID ?? "@pmate/chat"

type JsonValue = Record<string, unknown>

const requireTestKey = () => {
  const testKey = process.env.TEST_AUTH_KEY
  if (!testKey) {
    throw new Error("Missing TEST_AUTH_KEY")
  }
  return testKey
}

const readJson = async (response: { json: () => Promise<JsonValue> }) => {
  return response.json()
}

const escapeRegExp = (value: string) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

test("login with test account and switch profile", async ({
  page,
  request,
}) => {
  await page.goto("/")
  await page.waitForURL(/https:\/\/auth\.pmate\.chat/)
  const authUrl = new URL(page.url())
  expect(authUrl.origin).toBe("https://auth.pmate.chat")
  expect(authUrl.searchParams.get("app")).toBe(APP_ID)

  const testKey = requireTestKey()
  const now = Date.now()
  const mobile = `test_${now}`
  const vcodeResponse = await request.post(`${AUTH_BASE_URL}/vcode`, {
    headers: {
      "content-type": "application/json",
      "x-test": testKey,
    },
    data: {
      mobile,
      purpose: "login",
    },
  })
  expect(vcodeResponse.ok()).toBe(true)
  const vcodeJson = await readJson(vcodeResponse)
  expect(vcodeJson.success).toBe(true)
  const vcodeData = vcodeJson.data as Record<string, unknown> | undefined

  const loginPayload = {
    body: {
      type: "sms",
      mobile,
      vcode: "888888",
    },
    nonce: vcodeData?.nonce,
    issuedAt: vcodeData?.issuedAt,
    app: APP_ID,
  }

  const loginResponse = await request.post(`${AUTH_BASE_URL}/login`, {
    headers: {
      "content-type": "application/json",
      "x-test": testKey,
    },
    data: loginPayload,
  })
  expect(loginResponse.ok()).toBe(true)
  const loginJson = await readJson(loginResponse)
  expect(loginJson.success).toBe(true)
  const loginData = loginJson.data as Record<string, unknown> | undefined
  const token =
    typeof loginData?.token === "string" ? loginData.token : undefined
  expect(typeof token).toBe("string")
  expect(token?.length ?? 0).toBeGreaterThan(0)

  const sessionResponse = await request.get(`${AUTH_BASE_URL}/session`, {
    headers: {
      authorization: `Bearer ${token}`,
    },
  })
  expect(sessionResponse.ok()).toBe(true)
  const sessionJson = await readJson(sessionResponse)
  expect(sessionJson.success).toBe(true)
  const sessionData = sessionJson.data as Record<string, unknown> | undefined
  const identity = sessionData?.identity as JsonValue | undefined
  const accountId =
    typeof identity?.accountId === "string" ? identity.accountId : undefined
  expect(typeof accountId).toBe("string")
  expect(accountId?.length ?? 0).toBeGreaterThan(0)

  const profileOneName = `e2e-one-${now}`
  const profileTwoName = `e2e-two-${now}`

  const createProfile = async (nickName: string, role: string) => {
    const response = await request.post(`${AUTH_BASE_URL}/profile`, {
      headers: {
        "content-type": "application/json",
      },
      data: {
        app: APP_ID,
        account: accountId,
        nickName,
        role,
        learningTargetLang: "en",
      },
    })
    expect(response.ok()).toBe(true)
    const json = await readJson(response)
    expect(json.success).toBe(true)
  }

  await createProfile(profileOneName, "practitioner")
  await createProfile(profileTwoName, "mate")

  const profilesUrl = `${AUTH_BASE_URL}/profiles?${new URLSearchParams({
    app: APP_ID,
    account: accountId,
  }).toString()}`
  const profilesResponse = await request.get(profilesUrl)
  expect(profilesResponse.ok()).toBe(true)
  const profilesJson = await readJson(profilesResponse)
  expect(profilesJson.success).toBe(true)

  const sessionBody = JSON.stringify(sessionJson)
  await page.route(`${AUTH_BASE_URL}/session`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: sessionBody,
    })
  })
  const profilesBody = JSON.stringify(profilesJson)
  await page.route(
    new RegExp(`^${escapeRegExp(AUTH_BASE_URL)}/profiles\\?`),
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: profilesBody,
      })
    }
  )

  await page.goto(`/?sessionId=${encodeURIComponent(token ?? "")}`)
  await page.getByTestId("profile-menu-button").click()

  const selector = page.locator("#profile-selector")
  await expect(selector).toBeVisible()

  const nickname = page.getByTestId("profile-nickname")
  await expect(nickname).not.toHaveText("")
  const currentName = (await nickname.textContent())?.trim() ?? ""
  const targetName =
    currentName === profileOneName ? profileTwoName : profileOneName

  const profilesData = Array.isArray(profilesJson.data)
    ? (profilesJson.data as Array<Record<string, unknown>>)
    : []
  const targetProfile = profilesData.find(
    (profile) => profile?.nickName === targetName
  )
  const targetProfileId =
    typeof targetProfile?.id === "string" ? targetProfile.id : ""
  expect(targetProfileId.length).toBeGreaterThan(0)

  await selector.getByText(targetName, { exact: true }).click()
  await expect
    .poll(async () => {
      return await page.evaluate(() => {
        const raw = localStorage.getItem("selected-profile")
        return raw ? JSON.parse(raw) : null
      })
    })
    .toBe(targetProfileId)
  await page.goto(`/?sessionId=${encodeURIComponent(token ?? "")}`)
  await page.getByTestId("profile-menu-button").click()
  await expect(page.getByTestId("profile-nickname")).toHaveText(
    targetName
  )
})
