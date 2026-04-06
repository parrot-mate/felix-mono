import { afterAll, beforeAll, describe, expect, it } from "vitest"
import "../src/env"
import { spawn } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const port = process.env.TODOS_PORT ?? process.env.PORT ?? "5200"
const baseUrl =
  process.env.TODOS_BASE_URL ?? `http://localhost:${port.toString()}`

type JsonValue = Record<string, unknown>
let serverProcess: ReturnType<typeof spawn> | null = null

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function waitForHealth(url: string, timeoutMs = 10_000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(`${url}/health`)
      if (response.ok) return
    } catch {
      // ignore
    }
    await wait(200)
  }
  throw new Error(`Todos server did not become ready in ${timeoutMs}ms`)
}

async function waitForTodo(id: string, timeoutMs = 10_000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const { json } = await requestJson(`/todos/${id}`)
    const data = (json?.data ?? null) as JsonValue | null
    if (data && data.id === id) {
      return data
    }
    await wait(300)
  }
  throw new Error(`Todo ${id} not available within ${timeoutMs}ms`)
}

async function waitForSetting(
  key: string,
  expectedValue: unknown,
  timeoutMs = 25_000
) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const { json } = await requestJson(`/settings/${encodeURIComponent(key)}`)
    if ((json as JsonValue | null)?.success) {
      const value = (json as JsonValue).data ?? null
      try {
        expect(value).toEqual(expectedValue)
        return value
      } catch {
        // ignore until indexed
      }
    }
    await wait(300)
  }
  throw new Error(`Setting ${key} not available within ${timeoutMs}ms`)
}

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

describe("todos e2e", () => {
  beforeAll(async () => {
    const testDir = path.dirname(fileURLToPath(import.meta.url))
    serverProcess = spawn("bun", ["run", "src/index.ts"], {
      cwd: path.resolve(testDir, ".."),
      stdio: "inherit",
      env: process.env,
    })
    await waitForHealth(baseUrl)
  })

  afterAll(() => {
    if (serverProcess) {
      serverProcess.kill()
      serverProcess = null
    }
  })

  it("creates, reads, updates, and deletes a todo", async () => {
    const title = `e2e-${Date.now()}`
    const { json: createJson } = await requestJson("/todos", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ title }),
    })

    const created = (createJson?.data ?? {}) as JsonValue
    const id = created.id as string
    expect(createJson?.success).toBe(true)
    expect(typeof id).toBe("string")
    expect(id.length).toBeGreaterThan(0)

    const fetched = await waitForTodo(id)
    expect(fetched.title).toBe(title)

    const { json: listJson } = await requestJson("/todos?page=0")
    const list = (listJson?.data ?? []) as JsonValue[]
    expect(listJson?.success).toBe(true)
    expect(Array.isArray(list)).toBe(true)
    expect(list.some((item) => item.id === id)).toBe(true)

    const { json: updateJson } = await requestJson(`/todos/${id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ done: true }),
    })
    expect(updateJson?.success).toBe(true)

    const { json: getAfterJson } = await requestJson(`/todos/${id}`)
    const updated = (getAfterJson?.data ?? {}) as JsonValue
    expect(getAfterJson?.success).toBe(true)
    expect(updated.done).toBe(true)

    const { json: deleteJson } = await requestJson(`/todos/${id}`, {
      method: "DELETE",
    })
    expect(deleteJson?.success).toBe(true)
  })

  it(
    "sets and reads settings via stdMap",
	    async () => {
	      const key = `e2e-setting-${Date.now()}`
	      const value = { theme: "dark", updatedAt: Date.now() }

	      const { json: setJson } = await requestJson(
	        `/settings/${encodeURIComponent(key)}`,
	        {
	          method: "PUT",
	          headers: {
	            "content-type": "application/json",
	          },
	          body: JSON.stringify({ value }),
	        }
	      )
	      expect(setJson?.success).toBe(true)

	      const readValue = await waitForSetting(key, value)
	      expect(readValue).toEqual(value)
	    },
	    30_000
  )
})
