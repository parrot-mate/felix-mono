import "./env"
import "./globalerror"

import { cors } from "@elysiajs/cors"
import { node } from "@elysiajs/node"
import { TS_Log_Init, TS_LogKind } from "@pmate/meta"
import { ServiceError } from "@pmate/service-core"
import { blockchain } from "./blockchain"
import { Elysia } from "elysia"

const app = new Elysia({
  adapter: node(),
})
  .use(
    cors({
      origin: (request) => isAllowedOrigin(request.headers.get("origin")),
      methods: ["POST", "OPTIONS"],
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
  }
})

app.post("/user-logs", async ({ request, body }) => {
  const payload = await readJsonBody<{
    logs: TS_Log_Init<unknown>[]
  }>(request, body)
  const { logs } = payload
  if (!Array.isArray(logs) || !logs.length) {
    throw new Error("logs must be a non-empty array")
  }
  const invalidLog = logs.find((log) => log.kind !== TS_LogKind.UserLogs)
  if (invalidLog) {
    throw new Error("Only UserLogs kind logs are allowed")
  }
  await blockchain.appendBatch(logs)
  return ok("ok")
})

app.get("/ok", () => ({
  code: 200,
  message: "ok",
}))

const PORT = process.env.LOG_PORT || process.env.PORT || 5791
app.listen(PORT)
console.log(`Log API server is running on port ${PORT}`)

function ok(data: unknown) {
  return { success: true, data }
}

async function readJsonBody<T>(request: Request, body: unknown): Promise<T> {
  if (body !== undefined) {
    return body as T
  }
  if (!request.body) {
    return {} as T
  }
  const text = await request.text()
  if (!text) {
    return {} as T
  }
  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error("Invalid JSON")
  }
}

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
