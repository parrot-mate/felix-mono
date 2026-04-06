import type { Agent } from "./agent.types"

export type AgentRegistryStatus = "active" | "disabled"

export type RegistryRecord<TPayload> = {
  id: string
  namespace: string
  name: string
  status: AgentRegistryStatus
  payload: TPayload
  version: number
  createdAt: number
  updatedAt: number
  createdBy: string
  updatedBy: string
  tags?: string[]
  description?: string
}

export type AgentRecord = RegistryRecord<Agent>

export type AgentNamespaceRecord = {
  id: string
  namespace: string
  createdAt: number
  updatedAt: number
  createdBy: string
  updatedBy: string
  status: AgentRegistryStatus
}

export type CreateAgentInput = {
  name: string
  payload: Agent
  tags?: string[]
  description?: string
}

export type UpdateAgentInput = {
  payload?: Agent
  status?: AgentRegistryStatus
  tags?: string[]
  description?: string
  version?: number
}
