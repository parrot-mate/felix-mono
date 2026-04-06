import type { Agent } from "@pmate/meta"
import { getAgentById } from "./agents.list"

export class AgentService {
  static async getAgent(id: string): Promise<Agent> {
    const agent = getAgentById(id)
    if (!agent) {
      throw new Error(`Unknown agentId "${id}". Add it to agent-sdk/src/agents.list.ts.`)
    }
    return agent
  }
}
