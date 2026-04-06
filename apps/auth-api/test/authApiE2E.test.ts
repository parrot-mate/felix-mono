import { describe, expect, it } from "vitest"
import "../src/env"

const baseUrl =
  process.env.AUTH_API_BASE_URL ?? "https://auth-api-v2.pmate.chat"
const testIt = process.env.TEST_AUTH_KEY ? it : it.skip

function requireTestKey() {
  const testKey = process.env.TEST_AUTH_KEY
  if (!testKey) {
    throw new Error("Missing TEST_AUTH_KEY")
  }
  return testKey
}

type JsonValue = Record<string, unknown>

async function requestJson(
  path: string,
  options: RequestInit & { expectOk?: boolean } = {}
) {
  const url = `${baseUrl}${path}`
  const response = await fetch(url, options)
  const text = await response.text()
  let json: JsonValue | null = null
  if (text) {
    json = JSON.parse(text) as JsonValue
  }
  if (options.expectOk !== false && !response.ok) {
    console.error("url=", url, "method=", options.method)
    throw new Error(
      `Request failed ${response.status} ${response.statusText}: ${text}`
    )
  }
  return { response, json }
}

describe("auth-api e2e", () => {
  testIt("runs full account and profile flow", async () => {
    const testKey = requireTestKey()
    const mobile = `test_${Date.now()}`
    const app = "e2e"
    const { json: vcodeJson } = await requestJson("/vcode", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-test": testKey,
      },
      body: JSON.stringify({
        mobile,
        purpose: "login",
      }),
    })
    const vcodeData = (vcodeJson?.data ?? {}) as JsonValue
    const loginPayload = {
      body: {
        type: "sms",
        mobile,
        vcode: "888888",
      },
      nonce: vcodeData.nonce,
      issuedAt: vcodeData.issuedAt,
      app,
    }

    const { json: loginJson } = await requestJson("/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-test": testKey,
      },
      body: JSON.stringify(loginPayload),
    })

    expect(vcodeJson?.success).toBe(true)
    expect(typeof vcodeData.nonce).toBe("string")
    expect(typeof vcodeData.issuedAt).toBe("string")

    const loginData = (loginJson?.data ?? {}) as JsonValue
    const token = loginData.token as string | undefined
    expect(loginJson?.success).toBe(true)
    expect(typeof token).toBe("string")
    expect(token?.length ?? 0).toBeGreaterThan(0)

    const { json: sessionJson } = await requestJson("/session", {
      headers: {
        authorization: `Bearer ${token}`,
      },
    })
    const sessionData = (sessionJson?.data ?? {}) as JsonValue
    const identity = (sessionData.identity ?? {}) as JsonValue
    expect(sessionJson?.success).toBe(true)
    expect(typeof identity.accountId).toBe("string")
    const accountId = identity.accountId as string
    expect(accountId.length).toBeGreaterThan(0)

    const profileOnePayload = {
      app,
      account: accountId,
      nickName: `e2e-one-${Date.now()}`,
      role: "practitioner",
    }
    const { json: profileOneJson } = await requestJson("/profile", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(profileOnePayload),
    })
    expect(profileOneJson?.success).toBe(true)

    const profileTwoPayload = {
      app,
      account: accountId,
      nickName: `e2e-two-${Date.now()}`,
      role: "mate",
    }
    const { json: profileTwoJson } = await requestJson("/profile", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(profileTwoPayload),
    })
    expect(profileTwoJson?.success).toBe(true)

    const { json: profilesJson } = await requestJson(
      `/profiles?app=${encodeURIComponent(app)}&account=${encodeURIComponent(
        accountId
      )}`
    )
    const profiles = (profilesJson?.data ?? []) as JsonValue[]
    expect(profilesJson?.success).toBe(true)
    expect(profiles.length).toBe(2)

    const { json: logoutJson } = await requestJson("/logout", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
      },
    })
    expect(logoutJson?.success).toBe(true)

    const { response: afterLogoutResponse } = await requestJson("/session", {
      headers: {
        authorization: `Bearer ${token}`,
      },
      expectOk: false,
    })
    expect(afterLogoutResponse.status).toBe(401)
  })

  testIt("rejects direct test login without vcode issuance", async () => {
    const testKey = requireTestKey()
    const mobile = `test_${Date.now()}`
    const { response } = await requestJson("/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-test": testKey,
      },
      body: JSON.stringify({
        body: {
          type: "sms",
          mobile,
          vcode: "888888",
        },
        nonce: "missing",
        issuedAt: new Date().toISOString(),
        app: "e2e",
      }),
      expectOk: false,
    })

    expect(response.status).toBe(401)
  })
})
