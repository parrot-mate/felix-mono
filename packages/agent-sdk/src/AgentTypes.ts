import type { Agent } from "@pmate/meta"
import type { AsyncStream, EmitterV2 } from "@pmate/utils"

export type AgentFactoryBaseOptions = {
  wsUrl: string
  id: string
  token: string
  heartbeatIntervalMs?: number
}

export type PromptTaskStart = {
  taskId: string
  agentId: string
  from: string
  type: string
  contentEncoding?: string
  payload?: unknown
}

export type StreamTaskStart = {
  taskId: string
  agentId: string
  from: string
  type: string
  contentEncoding?: string
  params?: unknown
}

export type AgentEventMap = {
  connected: void
  disconnected: void
  "task:start": {
    taskId: string
    from: string
    mode: "prompt" | "stream"
  }
  "task:end": {
    taskId: string
    mode: "prompt" | "stream"
    success: boolean
  }
  error: unknown
}

export type AgentLifecycle = {
  start: () => Promise<void>
  stop: () => void
  isRunning: () => boolean
  on: EmitterV2<AgentEventMap>["on"]
  onAll: EmitterV2<AgentEventMap>["onAll"]
}

export type AgentFinalOptions = {
  type?: string
  contentEncoding?: string
}

export type AgentProgressOptions = AgentFinalOptions

export type AgentFailOptions = {
  type?: string
}

export type PromptContext = {
  task: PromptTaskStart
  agent: Agent
  progress: (payload: unknown, options?: AgentProgressOptions) => Promise<void>
  final: (payload: unknown, options?: AgentFinalOptions) => Promise<void>
  fail: (message: string, options?: AgentFailOptions) => Promise<void>
}

export type StreamChunkApi = {
  bytes: () => AsyncIterable<Uint8Array>
  text: () => AsyncIterable<string>
  json: <T = unknown>() => AsyncIterable<T>
}

export type StreamContext = {
  input: StreamChunkApi
  progress: (payload: unknown, options?: AgentProgressOptions) => Promise<void>
  complete: (payload: unknown, options?: AgentFinalOptions) => Promise<void>
  fail: (message: string, options?: AgentFailOptions) => Promise<void>
}

export type CreatePromptAgentOptions = AgentFactoryBaseOptions & {
  onPrompt: (ctx: PromptContext) => Promise<unknown> | unknown
  onError?: (error: Error, ctx: PromptContext) => void
}

export type CreateStreamAgentOptions = AgentFactoryBaseOptions & {
  onStream: (task: StreamTaskStart, ctx: StreamContext) => Promise<unknown> | unknown
  onError?: (error: Error, task: StreamTaskStart, ctx: StreamContext) => void
}

export type TaskStateBase = {
  taskId: string
  from: string
  finalized: boolean
}

export type PromptTaskState = TaskStateBase & {
  start: PromptTaskStart
}

export type StreamTaskState = TaskStateBase & {
  start: StreamTaskStart
  input: AsyncStream<Uint8Array>
}
