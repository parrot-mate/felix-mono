import { cors } from "@elysiajs/cors"
import { node } from "@elysiajs/node"
import type { CreateAgentInput, UpdateAgentInput } from "@pmate/meta"
import { BizErrorCode, TopicNames, TS_LogKind, type TS_Log_Init } from "@pmate/meta"
import { ServiceError } from "@pmate/service-core"
import { Elysia } from "elysia"
import { AgentRegistryService } from "./agentRegistry"
import { authenticateRequest, requireAdmin, type AuthService } from "./auth"

type AgentUiUserAction = {
  action: string
  payload?: unknown
  at?: number
}

type AgentUiSession = {
  sessionId: string
  status: "started" | "ended" | "updated"
  startedAt?: number
  endedAt?: number
  meta?: unknown
}

type AgentUiUserActionLog = {
  category: "action"
  userId: string
  sessionId?: string
  action: string
  payload?: unknown
  at: number
}

type AgentUiSessionLog = {
  category: "session"
  userId: string
  sessionId: string
  status: "started" | "ended" | "updated"
  startedAt?: number
  endedAt?: number
  meta?: unknown
  at: number
}

export function createAgentUiApiApp(options: {
  registry?: AgentRegistryService
  auth?: AuthService
} = {}) {
  const registry = options.registry ?? loadDefaultRegistry()
  const auth = options.auth ?? { authenticateRequest, requireAdmin }

  const app = new Elysia({
    adapter: node(),
  }).use(
    cors({
      origin: (request) => isAllowedOrigin(request.headers.get("origin")),
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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

  app.post("/user-actions", async ({ request, body }) => {
    const payload = await readJsonBody<{
      userId: string
      sessionId?: string
      actions: AgentUiUserAction[]
    }>(request, body)
    const { userId, sessionId, actions } = payload
    if (!userId) {
      throw new Error("userId is required")
    }
    if (!Array.isArray(actions) || actions.length === 0) {
      throw new Error("actions must be a non-empty array")
    }

    const topic = TopicNames.userLogs(userId)
    const logs: TS_Log_Init<AgentUiUserActionLog>[] = actions.map((action) => ({
      kind: TS_LogKind.UserLogs,
      topic,
      data: {
        category: "action",
        userId,
        sessionId,
        action: action.action,
        payload: action.payload,
        at: action.at ?? Date.now(),
      },
    }))

    await getBlockchain().appendBatch(logs)
    return ok({ count: logs.length })
  })

  app.post("/sessions", async ({ request, body }) => {
    const payload = await readJsonBody<{
      userId: string
      session: AgentUiSession
    }>(request, body)
    const { userId, session } = payload
    if (!userId) {
      throw new Error("userId is required")
    }
    if (!session?.sessionId) {
      throw new Error("session.sessionId is required")
    }

    const topic = TopicNames.userLogs(userId)
    const log: TS_Log_Init<AgentUiSessionLog> = {
      kind: TS_LogKind.UserLogs,
      topic,
      data: {
        category: "session",
        userId,
        sessionId: session.sessionId,
        status: session.status,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        meta: session.meta,
        at: Date.now(),
      },
    }

    await getBlockchain().appendBatch([log])
    return ok("ok")
  })

  app.get("/agents", async ({ request }) => {
    const account = await auth.authenticateRequest(request)
    const url = new URL(request.url)
    const namespace = url.searchParams.get("namespace")?.trim() || undefined
    const records = await registry.listAgents(namespace)
    return ok({
      accountId: account.accountId,
      items: records,
    })
  })

  app.get("/agents/namespaces", async ({ request }) => {
    const account = await auth.authenticateRequest(request)
    const records = await registry.listNamespaces()
    return ok({
      accountId: account.accountId,
      items: records,
    })
  })

  app.get("/agents/:namespace/:name", async ({ request, params }) => {
    await auth.authenticateRequest(request)
    const record = await registry.getAgent(params.namespace, params.name)
    if (!record) {
      throw new ServiceError("Agent not found", 404, BizErrorCode.AUTH_ERROR)
    }
    return ok(record)
  })

  app.post("/agents/:namespace", async ({ request, params, body }) => {
    const account = await auth.authenticateRequest(request)
    auth.requireAdmin(account.accountId)
    const input = await readJsonBody<CreateAgentInput>(request, body)
    const record = await registry.createAgent(
      params.namespace,
      input,
      account.accountId,
      request.headers.get("x-request-id") ?? undefined
    )
    return ok(record)
  })

  app.put("/agents/:namespace/:name", async ({ request, params, body }) => {
    const account = await auth.authenticateRequest(request)
    auth.requireAdmin(account.accountId)
    const input = await readJsonBody<UpdateAgentInput>(request, body)
    const record = await registry.updateAgent(
      params.namespace,
      params.name,
      input,
      account.accountId,
      request.headers.get("x-request-id") ?? undefined
    )
    return ok(record)
  })

  app.delete("/agents/:namespace/:name", async ({ request, params }) => {
    const account = await auth.authenticateRequest(request)
    auth.requireAdmin(account.accountId)
    const record = await registry.disableAgent(
      params.namespace,
      params.name,
      account.accountId,
      request.headers.get("x-request-id") ?? undefined
    )
    return ok(record)
  })

  app.get("/", () => ({
    code: 200,
    message: "ok",
  }))

  app.get("/ok", () => ({
    code: 200,
    message: "ok",
  }))

  return app
}

function loadDefaultRegistry() {
  return new AgentRegistryService(getBlockchain())
}

function getBlockchain() {
  const { blockchain } = require("./blockchain") as typeof import("./blockchain")
  return blockchain
}

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
