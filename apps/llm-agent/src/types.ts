export type LlmOutputType = "text" | "json"

export type LlmOutput = {
  type: LlmOutputType
  content: any
}

export type LlmPromptPayload = Record<string, unknown>
