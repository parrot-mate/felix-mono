import "./env"
import "./globalerror"

import { cors } from "@elysiajs/cors"
import { node } from "@elysiajs/node"
import { BizErrorCode } from "@pmate/meta"
import { ServiceError, SessionManager } from "@pmate/service-core"
import { Elysia } from "elysia"

const app = new Elysia({
  adapter: node(),
})
  .use(
    cors({
      origin: (request) => isAllowedOrigin(request.headers.get("origin")),
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: "content-type, authorization",
      credentials: true,
      maxAge: 86400,
    })
  )

app.onRequest(({ request }) => {
  const origin = request.headers.get("origin")
  if (!isAllowedOrigin(origin)) {
    return new Response("Not allowed by CORS", { status: 403 })
  }
})

app.onError(({ error, set, request }) => {
  console.log("Error occurred:", error)
  if (error instanceof ServiceError) {
    set.status = error.httpCode || 500
    return {
      success: false,
      message: error.message,
      code: error.bizCode,
    }
  }
  set.status = 500
  return {
    success: false,
    message: error instanceof Error ? error.message : String(error),
    path: new URL(request.url).pathname,
    stack: error instanceof Error ? error.stack : undefined,
  }
})

const authGuard = {
  beforeHandle: async ({ request }: { request: Request }) => {
    if (request.method.toUpperCase() === "OPTIONS") {
      return
    }
    const { session } = await SessionManager.requireSessionFromRequest(request)
    const accountId = session.identity?.accountId
    if (!accountId) {
      throw new ServiceError("Missing session", 401, BizErrorCode.AUTH_ERROR)
    }

    const whitelist = getBlockMgrWhitelist()
    if (whitelist.length > 0 && !whitelist.includes(accountId)) {
      throw new ServiceError("Not allowed", 403, BizErrorCode.AUTH_ERROR)
    }
  },
}

app.get("/", () => "Block Manager Proxy is running.")

app.guard(authGuard, (guarded) => {
  guarded.all("/*", async ({ request }) => {
    return proxyToTsdb(request)
  })

  return guarded
})

const PORT = process.env.BLOCK_MGR_PORT || process.env.PORT || 5792
app.listen(PORT)
console.log(`Block manager proxy running on port ${PORT}`)

function isAllowedOrigin(origin: string | null) {
  if (!origin) {
    return true
  }
  if (origin.includes("localhost")) {
    return true
  }

  if (origin.match(/(skedo\.cn|(pmate\.chat))/)) {
    return true
  }
  return false
}

function getBlockMgrWhitelist(): string[] {
  const raw = process.env.BLOCK_MGR_WHITELIST || ""
  if (!raw.trim()) {
    return []
  }
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
}

function getTsdbBaseUrl() {
  const raw = process.env.TSDB_ENDPOINT
  if (!raw) {
    throw new Error("TSDB_ENDPOINT is not set")
  }
  return raw.replace(/\/+$/, "")
}

function buildTargetUrl(request: Request) {
  const url = new URL(request.url)
  return `${getTsdbBaseUrl()}${url.pathname}${url.search}`
}

async function proxyToTsdb(request: Request) {
  const targetUrl = buildTargetUrl(request)
  const headers = new Headers(request.headers)
  headers.delete("host")
  headers.delete("content-length")

  const method = request.method.toUpperCase()
  const init: RequestInit = {
    method,
    headers,
    redirect: "manual",
  }

  if (method !== "GET" && method !== "HEAD") {
    init.body = request.body
  }

  const response = await fetch(targetUrl, init)
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  })
}
