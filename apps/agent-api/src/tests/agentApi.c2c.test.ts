import { describe, expect, it } from "vitest"
import "../env"

type JsonObject = Record<string, unknown>
let cachedTokenPromise: Promise<string | null> | null = null
const describeRemote = process.env.REMOTE === "1" ? describe : describe.skip

async function requestJson(
  path: string,
  options: RequestInit & { expectOk?: boolean } = {}
) {
  const response = await fetch(`${getBaseUrl()}${path}`, options)
  const text = await response.text()
  let json: JsonObject | null = null
  if (text) {
    json = JSON.parse(text) as JsonObject
  }
  if (options.expectOk !== false && !response.ok) {
    throw new Error(
      `Request failed ${response.status} ${response.statusText}: ${text}`
    )
  }
  return { response, json }
}

async function authHeaders(extra: Record<string, string> = {}) {
  const token = await getToken()
  if (!token) {
    throw new Error("Missing AGENT_API_TEST_TOKEN")
  }
  return {
    authorization: `Bearer ${token}`,
    ...extra,
  }
}

describeRemote("agent-api c2c", () => {
  it("can list agents from the deployed API", async () => {
    const token = await getToken()
    if (!token) {
      return
    }

    const { json } = await requestJson(
      `/agents?namespace=${encodeURIComponent(getNamespace())}`,
      {
        headers: await authHeaders(),
      }
    )

    expect(json?.success).toBe(true)
    const data = (json?.data ?? {}) as JsonObject
    expect(Array.isArray(data.items)).toBe(true)
  }, 40_000)

  it("can run write-path CRUD against the deployed API when explicitly enabled", async () => {
    const token = await getToken()
    if (!token || !isWriteEnabled()) {
      return
    }

    const namespace = getNamespace()
    const name = `c2c-${Date.now()}`
    const createPayload = {
      name,
      payload: {
        id: "placeholder",
        type: "LLM",
        accuracy: "medium",
        responseType: "text",
        realtime: false,
        variables: [{ name: "text", type: "text" }],
        instruction: "Summarize the text.",
        prompt: "{{text}}",
      },
    }

    const { json: createJson } = await requestJson(`/agents/${encodeURIComponent(namespace)}`, {
      method: "POST",
      headers: await authHeaders({ "content-type": "application/json" }),
      body: JSON.stringify(createPayload),
    })
    expect(createJson?.success).toBe(true)

    const { json: getJson } = await requestJson(
      `/agents/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`,
      {
        headers: await authHeaders(),
      }
    )
    expect((getJson?.data as JsonObject)?.id).toBe(`${namespace}:${name}`)

    const { json: updateJson } = await requestJson(
      `/agents/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`,
      {
        method: "PUT",
        headers: await authHeaders({ "content-type": "application/json" }),
        body: JSON.stringify({
          description: "updated by c2c",
          version: 1,
        }),
      }
    )
    expect(updateJson?.success).toBe(true)

    const { json: deleteJson } = await requestJson(
      `/agents/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`,
      {
        method: "DELETE",
        headers: await authHeaders(),
      }
    )
    expect((deleteJson?.data as JsonObject)?.status).toBe("disabled")
  }, 40_000)
})

function getBaseUrl() {
  return process.env.AGENT_API_BASE_URL ?? "https://agent-api.pmate.chat"
}

async function getToken() {
  if (!cachedTokenPromise) {
    cachedTokenPromise = resolveToken()
  }
  return cachedTokenPromise
}

function getNamespace() {
  return process.env.AGENT_API_TEST_NAMESPACE ?? "c2c"
}

function isWriteEnabled() {
  return process.env.AGENT_API_ENABLE_WRITE_C2C === "true"
}

async function resolveToken(): Promise<string | null> {
  const explicitToken = process.env.AGENT_API_TEST_TOKEN?.trim()
  if (explicitToken) {
    return explicitToken
  }

  const testAuthKey = process.env.TEST_AUTH_KEY?.trim()
  if (!testAuthKey) {
    return null
  }

  const authApiBaseUrl =
    process.env.AUTH_API_BASE_URL ?? "https://auth-api-v2.pmate.chat"
  const mobile = `test_${Date.now()}`
  const { json: vcodeJson } = await requestJsonWithBaseUrl(
    authApiBaseUrl,
    "/vcode",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-test": testAuthKey,
      },
      body: JSON.stringify({
        mobile,
        purpose: "login",
      }),
    }
  )
  const vcodeData = vcodeJson?.data as JsonObject | undefined
  const payload = {
    body: {
      type: "sms",
      mobile,
      vcode: "888888",
    },
    nonce: vcodeData?.nonce,
    issuedAt: vcodeData?.issuedAt,
    app: "agent-api-c2c",
  }

  const { json } = await requestJsonWithBaseUrl(authApiBaseUrl, "/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-test": testAuthKey,
    },
    body: JSON.stringify(payload),
  })

  const token = (json?.data as JsonObject | undefined)?.token
  if (typeof token !== "string" || !token) {
    throw new Error("Failed to obtain test session token from auth-api")
  }
  return token
}

async function requestJsonWithBaseUrl(
  baseUrl: string,
  path: string,
  options: RequestInit & { expectOk?: boolean } = {}
) {
  const response = await fetch(`${baseUrl.replace(/\/+$/, "")}${path}`, options)
  const text = await response.text()
  let json: JsonObject | null = null
  if (text) {
    json = JSON.parse(text) as JsonObject
  }
  if (options.expectOk !== false && !response.ok) {
    throw new Error(
      `Request failed ${response.status} ${response.statusText}: ${text}`
    )
  }
  return { response, json }
}
