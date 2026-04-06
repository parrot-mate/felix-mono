import { AgentType, type Agent } from "@pmate/meta"

export const agentsById: Record<string, Agent> = {
  "agent:summary": {
    id: "agent:summary",
    type: AgentType.LLM,
    accuracy: "medium",
    responseType: "text",
    realtime: false,
    variables: [
      { name: "text", type: "text" },
      { name: "language", type: "text" },
    ],
    instruction:
      "You are a concise assistant. Summarize the input text in {{language}} with key points only.",
    prompt: "Text:\\n{{text}}",
  },
  "agent:image": {
    id: "agent:image",
    type: AgentType.LLM,
    accuracy: "medium",
    responseType: "json",
    realtime: false,
    variables: [
      { name: "topic", type: "text" },
      { name: "style", type: "text" },
    ],
    instruction:
      "You create image prompts. Return JSON only with shape {\"prompt\":\"...\"}.",
    prompt: "Topic: {{topic}}\\nStyle: {{style}}",
  },
  "agent:llm-c2c": {
    id: "agent:llm-c2c",
    type: AgentType.LLM,
    accuracy: "medium",
    responseType: "text",
    realtime: false,
    variables: [
      { name: "text", type: "text" },
      { name: "language", type: "text" },
    ],
    instruction:
      "You are a concise assistant. Summarize the input text in {{language}} with key points only.",
    prompt: "Text:\\n{{text}}",
  },
  "agent:summary-json": {
    id: "agent:summary-json",
    type: AgentType.LLM,
    accuracy: "medium",
    responseType: "json",
    realtime: false,
    variables: [
      { name: "text", type: "text" },
      { name: "language", type: "text" },
    ],
    instruction:
      'You are a concise assistant. Return JSON only with shape {"summary":"string","language":"string","keyPoints":"string[]"} and no markdown.',
    prompt: "Text:\\n{{text}}\\nLanguage:\\n{{language}}",
  },
  "agent:transcribe": {
    id: "agent:transcribe",
    type: AgentType.ASR,
    latency: "remote",
  },
  "agent:echo": {
    id: "agent:echo",
    type: AgentType.ECHO,
  },
  "agent:echo-stream": {
    id: "agent:echo-stream",
    type: AgentType.ECHO,
  },
  "agent:echo-lowlevel": {
    id: "agent:echo-lowlevel",
    type: AgentType.ECHO,
  },
}

export function getAgentById(id: string): Agent | undefined {
  return agentsById[id]
}
