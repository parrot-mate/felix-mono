import {
  createPromptAgent,
  type AgentLifecycle,
  type PromptContext,
} from "@pmate/agent-sdk"
import { AgentType, type LLMAgent } from "@pmate/meta"
import { env } from "./env"
import { generateText } from "./generateText"
import { resolveModelByAccuracy } from "./model.def"
import type { LlmOutput, LlmPromptPayload } from "./types"

export type LlmAgentRuntimeConfig = {
  wsUrl: string
  token: string
  heartbeatIntervalMs?: number
}

type LlmPromptContext = PromptContext & {
  agent: LLMAgent
}

export function createLlmPromptAgent(config: LlmAgentRuntimeConfig): AgentLifecycle {
  return createPromptAgent({
    wsUrl: config.wsUrl,
    token: config.token,
    id: env.AGENT_SERVER_ID,
    heartbeatIntervalMs: config.heartbeatIntervalMs,
    async onPrompt(ctx): Promise<LlmOutput> {
      if (ctx.agent.type !== AgentType.LLM) {
        throw new Error(`Unsupported agent type ${ctx.agent.type} for llm-agent`)
      }
      const llmCtx: LlmPromptContext = {
        ...ctx,
        agent: ctx.agent,
      }
      return runLlmPrompt(llmCtx)
    },
    onError(error, ctx) {
      const { taskId, agentId } = ctx.task
      console.error("[llm-agent] prompt failed", {
        taskId,
        agentId,
        error: error.message,
      })
    },
  })
}

async function runLlmPrompt(ctx: LlmPromptContext): Promise<LlmOutput> {
  const task = ctx.task
  const { taskId, agentId, payload: rawPayload } = task
  const t0 = Date.now()
  console.log("[llm-agent] prompt received", {
    taskId,
    agentId,
  })
  const payload = (rawPayload ?? {}) as LlmPromptPayload
  validatePayloadVariables(payload, ctx.agent.variables.map((item) => item.name))
  const model = resolveModel(ctx.agent.accuracy)
  console.log("[llm-agent] model resolved", {
    taskId,
    provider: model.provider,
    version: model.version,
  })
  const text = await generateText(model, ctx.agent.instruction, ctx.agent.prompt, payload)
  console.log("[llm-agent] model response received", {
    taskId,
    elapsedMs: Date.now() - t0,
    outputChars: text.length,
  })
  if (ctx.agent.responseType === "json") {
    const json = JSON.parse(text)
    return {
      type: "json",
      content: json,
    }
  }
  return {
    type: "text",
    content: text,
  }
}

function resolveModel(accuracy: LLMAgent["accuracy"]) {
  return resolveModelByAccuracy(accuracy)
}

function validatePayloadVariables(payload: LlmPromptPayload, variableNames: string[]) {
  for (const name of variableNames) {
    if (payload[name] == null) {
      throw new Error(`Missing variable "${name}"`)
    }
  }
}
