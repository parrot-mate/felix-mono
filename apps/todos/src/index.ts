import "./env"

import { cors } from "@elysiajs/cors"
import { node } from "@elysiajs/node"
import { Elysia } from "elysia"
import { blockchain } from "./blockchain"

type Todo = {
  id: string
  title: string
  done: boolean
  createdAt: number
  updatedAt: number
}

type CreateTodoBody = {
  id?: string
  title: string
  done?: boolean
}

type UpdateTodoBody = {
  title?: string
  done?: boolean
}

const todos = blockchain.stdTable("@pmate/todos")
const settings = blockchain.stdMap("@pmate/todos_settings")

const createId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

const appOptions =
  typeof (globalThis as { Bun?: unknown }).Bun === "undefined"
    ? { adapter: node() }
    : {}
const app = new Elysia(appOptions)
  .use(
    cors({
      origin: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: "content-type, authorization",
      credentials: true,
      maxAge: 86400,
    })
  )
  .onError(({ error, set }) => {
    console.error("Todos API error:", error)
    set.status = 500
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    }
  })
  .get("/health", () => ({ ok: true }))
  .get("/todos", async ({ query }) => {
    const page = query?.page ? Number(query.page) : 0
    const data = await todos.list<Todo>(Number.isNaN(page) ? 0 : page)
    return { success: true, data }
  })
  .get("/todos/:id", async ({ params }) => {
    const todo = await todos.getById<Todo>(params.id)
    return { success: true, data: todo ?? null }
  })
  .get("/settings/:key", async ({ params }) => {
    const value = await settings.get<unknown>(params.key)
    return { success: true, data: value ?? null }
  })
  .post("/todos", async ({ body }) => {
    const payload = body as CreateTodoBody
    const now = Date.now()
    const todo: Todo = {
      id: payload.id ?? createId(),
      title: payload.title,
      done: payload.done ?? false,
      createdAt: now,
      updatedAt: now,
    }
    await todos.appendRow<Todo>(todo)
    return { success: true, data: todo }
  })
  .put("/settings/:key", async ({ params, body }) => {
    const payload = body as { value?: unknown }
    await settings.set(params.key, payload?.value ?? null)
    return { success: true }
  })
  .patch("/todos/:id", async ({ params, body }) => {
    const payload = body as UpdateTodoBody
    const updatedAt = Date.now()
    await todos.updateRow<Todo>({
      id: params.id,
      ...payload,
      updatedAt,
    })
    return { success: true }
  })
  .delete("/todos/:id", async ({ params }) => {
    await todos.deleteRow(params.id)
    return { success: true }
  })

const PORT = Number(process.env.TODOS_PORT ?? process.env.PORT ?? 5200)
app.listen(PORT)
console.log(`Todos API running on port ${PORT}`)
