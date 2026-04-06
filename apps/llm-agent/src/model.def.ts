import type { AgentModel, LLMAgent } from "@pmate/meta"

export const accuracyModelMap: Record<LLMAgent["accuracy"], AgentModel[]> = {
  low: [
    {
      provider: "openai",
      version: "gpt-5-nano-2025-08-07",
    },
    {
      provider: "gemini",
      version: "gemini-3-flash-preview",
    },
  ],
  medium: [
    {
      provider: "openai",
      version: "gpt-5-mini-2025-08-07",
    },
    {
      provider: "gemini",
      version: "gemini-3-flash-preview",
    },
  ],
  high: [
    {
      provider: "openai",
      version: "gpt-5.2-2025-12-11",
    },
    {
      provider: "gemini",
      version: "gemini-3-pro-preview",
    },
  ],
}

export function resolveModelByAccuracy(accuracy: LLMAgent["accuracy"]) {
  const models = accuracyModelMap[accuracy]
  if (!models?.length) {
    throw new Error(`No model configured for accuracy "${accuracy}"`)
  }
  return models[0]
}
