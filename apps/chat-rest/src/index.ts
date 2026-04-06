import "./env"
import "./globalerror"

import { cors } from "@elysiajs/cors"
import { node } from "@elysiajs/node"
import {
  GroupInfo,
  Profile,
  TopicNames,
  TS_Log_Init,
  TS_LogKind,
  UserReadMessageLog,
} from "@pmate/meta"
import {
  IndexerName,
  IndexerQuery,
  IndexerRestClient,
  ServiceError,
} from "@pmate/service-core"
import { blockchain } from "./blockchain"
import { Elysia } from "elysia"
import { createGroup, updateGroup } from "./service/group"
import { enrichThreads } from "./util/enrichThreads"

const INDEXER_BASE_URL = process.env.INDEXER_BASE_URL
if (!INDEXER_BASE_URL) {
  throw new Error("INDEXER_BASE_URL is required")
}
const indexerRestClient = new IndexerRestClient({ baseUrl: INDEXER_BASE_URL })

const app = new Elysia({
  adapter: node(),
})
  .use(
    cors({
      origin: (request) => isAllowedOrigin(request.headers.get("origin")),
      methods: ["GET", "POST", "PUT", "OPTIONS"],
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

app.get("/", () => ok("ok"))

app.get("/group", async ({ request, body }) => {
  const payload = await readJsonBody<Partial<Omit<GroupInfo, "id">>>(
    request,
    body
  )
  const group = await createGroup(payload)
  return ok(group)
})

app.put("/group", async ({ request, body }) => {
  const payload = await readJsonBody<Partial<GroupInfo>>(request, body)
  await updateGroup(payload)
  return ok("ok")
})

app.get("/entity/:id", async ({ params }) => {
  const { id } = params as { id?: string }
  if (!id) {
    return ok(null)
  }
  const profile = await IndexerQuery.entity<Profile>(id)
  return ok(profile)
})

app.post("/entities", async ({ request, body }) => {
  const payload = await readJsonBody<{ ids: string[] }>(request, body)
  const { ids } = payload
  const profile = await IndexerQuery.entities<Profile>(ids)
  return ok(profile)
})

app.post("/msg/read", async ({ request, body }) => {
  const payload = await readJsonBody<
    { userId: string; hash: string; threadHash: string }[]
  >(request, body)
  if (!Array.isArray(payload) || payload.length === 0) {
    throw new Error("Request body must be a non-empty array")
  }

  const logs: TS_Log_Init<UserReadMessageLog>[] = payload.map(
    ({ userId, hash, threadHash }) => {
      const normalizedUserId = typeof userId === "string" ? userId.trim() : ""
      const normalizedHash = typeof hash === "string" ? hash.trim() : ""
      const normalizedThreadHash =
        typeof threadHash === "string" ? threadHash.trim() : ""

      if (!normalizedUserId) {
        throw new Error("userId must be a non-empty string")
      }
      if (!normalizedHash) {
        throw new Error("hash must be a non-empty string")
      }
      if (!normalizedThreadHash) {
        throw new Error("threadHash must be a non-empty string")
      }

      const data: UserReadMessageLog = {
        userId: normalizedUserId,
        hash: normalizedHash,
        threadHash: normalizedThreadHash,
      }

      return {
        topic: TopicNames.usersMessage(normalizedUserId),
        kind: TS_LogKind.UserReadMessage,
        data,
      }
    }
  )

  await blockchain.appendBatch(logs)
  return ok("ok")
})

app.post("/msg/thread-read", async ({ request, body }) => {
  const payload = await readJsonBody<{
    user: string
    threadHash: string
    hashes: string[]
  }>(request, body)
  const { user, threadHash, hashes } = payload
  if (
    typeof user !== "string" ||
    typeof threadHash !== "string" ||
    !Array.isArray(hashes)
  ) {
    throw new Error("Invalid payload")
  }

  const response = await indexerRestClient.request("pmate", "thread", "read", {
    method: "POST",
    query: { user, threadHash, hashes },
  })
  return ok(response)
})

app.post("/msg/readmap/:userId", async ({ params, request, body }) => {
  const { userId } = params as { userId?: string }
  if (typeof userId !== "string" || !userId.trim()) {
    throw new Error("userId must be a non-empty string")
  }

  const hashs = await readJsonBody<string[]>(request, body)
  if (!Array.isArray(hashs) || hashs.length === 0) {
    throw new Error("Request body must be a non-empty array of hashs")
  }

  if (!hashs.every((hash) => typeof hash === "string" && hash.trim())) {
    throw new Error("hashs must be non-empty strings")
  }

  const normalizedHashes = hashs.map((hash) => hash.trim())
  const normalizedUserId = userId.trim()

  const bitmap = await IndexerQuery.readmap(normalizedUserId, normalizedHashes)
  return ok(bitmap)
})

app.get("/read-all/:userId", async ({ params }) => {
  const { userId } = params as { userId?: string }
  if (typeof userId !== "string" || !userId.trim()) {
    throw new Error("userId must be a non-empty string")
  }
  const readList = await IndexerQuery.readMsgList(userId.trim())
  return ok(readList)
})

app.get("/contacts", async ({ query }) => {
  const { userId, user } = query as { userId?: string; user?: string }
  const target = (userId || user || "").trim()
  if (!target) {
    return ok([])
  }
  const allowList = await IndexerQuery.getAllowedList(target)
  if (!allowList?.length) {
    return ok([])
  }
  const profiles = await IndexerQuery.entities<Profile | GroupInfo>(allowList)
  return ok(profiles)
})

app.get("/threads", async ({ query }) => {
  const { user } = query as { user?: string }
  if (typeof user !== "string" || !user.trim()) {
    throw new Error("user must be a non-empty string")
  }
  const threads = await IndexerQuery.threads(user.trim())
  const enriched = await enrichThreads(threads)
  return ok(enriched)
})

app.get("/thread/:user/:hash", async ({ params }) => {
  const { user, hash } = params as { user?: string; hash?: string }
  if (typeof user !== "string" || !user.trim()) {
    throw new Error("user must be a non-empty string")
  }
  if (typeof hash !== "string" || !hash.trim()) {
    throw new Error("hash must be a non-empty string")
  }
  const thread = await IndexerQuery.thread(user.trim(), hash.trim())
  if (!thread) {
    return ok(null)
  }
  const [enriched] = await enrichThreads([thread])
  return ok(enriched ?? null)
})

app.get("/acl/status", async ({ query }) => {
  const { from, to } = query as { from?: string; to?: string }
  const status = await IndexerQuery.aclQuery(from as string, to as string)
  return ok(status)
})

app.post("/acl/status_batch", async ({ request, body }) => {
  const payload = await readJsonBody<{
    pairs: {
      from: string
      to: string
    }[]
  }>(request, body)
  const status = await IndexerQuery.aclQueryBatch(payload.pairs)
  return ok(status)
})

app.get("/ok", () => ({
  code: 200,
  message: "ok",
}))

app.get("/chunk/:indexer/:action", async ({ params, query }) => {
  const { action, indexer } = params as { action: string; indexer: string }
  const response = await indexerRestClient.request(
    "pmate",
    indexer as IndexerName,
    action,
    {
      query: query as Record<string, any>,
    }
  )
  return ok(response)
})

const PORT = process.env.PORT || 5788
app.listen(PORT)
console.log(`Chat REST server is running on port ${PORT}`)

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
