import { existsSync, readFileSync } from "node:fs"
import { createRequire } from "node:module"
import os from "node:os"
import path from "node:path"
import WebSocket from "ws"

const require = createRequire(import.meta.url)

type AgentEnvelope<T> = {
  type?: "text" | "json"
  content?: T
}

export type PromptResult<T> = {
  agentId: string
  payload: Record<string, unknown>
  raw: T | AgentEnvelope<T> | null
  unwrapped: T | null
}

type AgentServiceInstance = unknown

type AgentServiceCtor = new (options: {
  agentApiBaseUrl: string
  token: string
}) => AgentServiceInstance

type AgentClientCtor = new (options: {
  baseUrl: string
  agentService: AgentServiceInstance
}) => {
  login(from: string, options: { token: string }): Promise<void>
  prompt<TFinal>(options: {
    agentId: string
    payload: Record<string, unknown>
  }): Promise<TFinal | AgentEnvelope<TFinal> | null>
  close(): void
}

const runtimeSdk = require("@pmate/agent-sdk") as {
  AgentClient: AgentClientCtor
  AgentService: AgentServiceCtor
}

const { AgentClient, AgentService } = runtimeSdk

if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = WebSocket as unknown as typeof globalThis.WebSocket
}

export function buildAgentId(namespace: string, name: string): string {
  return `${namespace}:${name}`
}

function readSessionToken(): string {
  const sessionPath = path.join(os.homedir(), ".pmate", "session.json")
  if (!existsSync(sessionPath)) {
    throw new Error(`Missing session file at ${sessionPath}. Run \"pmate login\" first.`)
  }
  const raw = readFileSync(sessionPath, "utf8")
  const parsed = JSON.parse(raw) as { token?: string }
  const token = parsed.token?.trim()
  if (!token) {
    throw new Error(`Missing token in ${sessionPath}. Run \"pmate login\" again.`)
  }
  return token
}

export function unwrapAgentResult<T>(value: T | AgentEnvelope<T> | null): T | null {
  if (!value || typeof value !== "object") {
    return value as T | null
  }
  if ("content" in value && "type" in value) {
    return (value as AgentEnvelope<T>).content ?? null
  }
  return value as T
}

export class BlueprintAgentError extends Error {
  readonly debug: {
    agentId: string
    payload: Record<string, unknown>
    rawAgentResponse: unknown
    unwrappedAgentResponse: unknown
  }

  constructor(
    message: string,
    debug: {
      agentId: string
      payload: Record<string, unknown>
      rawAgentResponse: unknown
      unwrappedAgentResponse: unknown
    },
  ) {
    super(message)
    this.name = "BlueprintAgentError"
    this.debug = debug
  }
}

export class BlueprintAgentClient {
  private readonly token: string
  private readonly namespace: string
  private readonly hubBaseUrl: string
  private readonly from: string
  private readonly agentService: AgentServiceInstance

  constructor(options: {
    token?: string
    namespace: string
    from?: string
    agentApiBaseUrl: string
    hubBaseUrl: string
  }) {
    this.token = options.token ?? readSessionToken()
    this.namespace = options.namespace
    this.hubBaseUrl = options.hubBaseUrl.replace(/\/+$/, "")
    this.from = options.from ?? "blueprint-api"
    this.agentService = new AgentService({
      agentApiBaseUrl: options.agentApiBaseUrl.replace(/\/+$/, ""),
      token: this.token,
    })
  }

  async promptJson<TFinal>(name: string, payload: Record<string, unknown>): Promise<TFinal> {
    return this.promptById<TFinal>(buildAgentId(this.namespace, name), payload)
  }

  async promptJsonDetailed<TFinal>(name: string, payload: Record<string, unknown>): Promise<PromptResult<TFinal>> {
    return this.promptByIdDetailed<TFinal>(buildAgentId(this.namespace, name), payload)
  }

  async promptById<TFinal>(agentId: string, payload: Record<string, unknown>): Promise<TFinal> {
    const result = await this.promptByIdDetailed<TFinal>(agentId, payload)
    if (result.unwrapped == null) {
      throw new BlueprintAgentError("Empty response from llm-agent", {
        agentId: result.agentId,
        payload: result.payload,
        rawAgentResponse: result.raw,
        unwrappedAgentResponse: result.unwrapped,
      })
    }
    return result.unwrapped
  }

  async promptByIdDetailed<TFinal>(agentId: string, payload: Record<string, unknown>): Promise<PromptResult<TFinal>> {
    const client = new AgentClient({
      baseUrl: this.hubBaseUrl,
      agentService: this.agentService,
    })

    try {
      await client.login(this.from, { token: this.token })
      const result = await client.prompt<TFinal>({
        agentId,
        payload,
      })
      const unwrapped = unwrapAgentResult(result)
      return {
        agentId,
        payload,
        raw: result,
        unwrapped,
      }
    } finally {
      client.close()
    }
  }
}
