export enum AgentType {
  LLM = "LLM", // 文本转文本（大语言模型 Agent）
  ASR = "ASR", // 语音转文本
  TTS = "TTS", // 文本转语音
  Translation = "Translation", // 翻译
  ECHO = "ECHO", // 测试回显
}

export interface AgentBase {
  id: string
  type: AgentType
}

export interface Variable {
  name: string
  type: "text" | "number" | "date" | "image" | "voice"
}

export type LLMAgent = AgentBase & {
  type: AgentType.LLM

  accuracy: "low" | "medium" | "high"
  // 模型质量偏好（影响模型/价格/延迟）

  responseType: "text" | "json"
  // 指定 LLM 返回格式

  realtime: boolean
  // 是否走 realtime / streaming / agent loop（默认 false）

  variables: Variable[]
  // prompt 中允许注入的变量声明

  instruction: string
  // 固定系统指令（跨调用复用）

  prompt: string
  // 单次调用 prompt（动态变化）
}

export type ASRAgent = AgentBase & {
  type: AgentType.ASR
  latency: "local" | "remote"
}

export type TTSAgent = AgentBase & {
  type: AgentType.TTS
}

export type TranslationAgent = AgentBase & {
  type: AgentType.Translation
}

export type EchoAgent = AgentBase & {
  type: AgentType.ECHO
}

export type Agent =
  | LLMAgent
  | ASRAgent
  | TTSAgent
  | TranslationAgent
  | EchoAgent

export type AgentModel = {
  provider: "openai" | "gemini"
  version: string
}
