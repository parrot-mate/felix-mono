import type { AgentLifecycle, CreatePromptAgentOptions, CreateStreamAgentOptions } from "./AgentTypes"
import { PromptAgent } from "./PromptAgent"
import { StreamAgent } from "./StreamAgent"

export type {
  AgentFactoryBaseOptions,
  PromptTaskStart,
  StreamTaskStart,
  AgentEventMap,
  AgentLifecycle,
  AgentFinalOptions,
  AgentProgressOptions,
  AgentFailOptions,
  PromptContext,
  StreamChunkApi,
  StreamContext,
  CreatePromptAgentOptions,
  CreateStreamAgentOptions,
  TaskStateBase,
  PromptTaskState,
  StreamTaskState,
} from "./AgentTypes"

export function createPromptAgent(options: CreatePromptAgentOptions): AgentLifecycle {
  return new PromptAgent(options)
}

export function createStreamAgent(options: CreateStreamAgentOptions): AgentLifecycle {
  return new StreamAgent(options)
}
