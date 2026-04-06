import type { Agent } from "@pmate/meta"
import type {
  AgentFailOptions,
  AgentFinalOptions,
  AgentProgressOptions,
  PromptContext,
  PromptTaskStart,
} from "./AgentTypes"

type PromptTaskContextHandlers = {
  progress: (payload: unknown, options?: AgentProgressOptions) => Promise<void>
  final: (payload: unknown, options?: AgentFinalOptions) => Promise<void>
  fail: (message: string, options?: AgentFailOptions) => Promise<void>
}

export class PromptTaskContext implements PromptContext {
  constructor(
    public readonly task: PromptTaskStart,
    public readonly agent: Agent,
    private readonly handlers: PromptTaskContextHandlers,
  ) {}

  public progress(payload: unknown, options?: AgentProgressOptions) {
    return this.handlers.progress(payload, options)
  }

  public final(payload: unknown, options?: AgentFinalOptions) {
    return this.handlers.final(payload, options)
  }

  public fail(message: string, options?: AgentFailOptions) {
    return this.handlers.fail(message, options)
  }
}
