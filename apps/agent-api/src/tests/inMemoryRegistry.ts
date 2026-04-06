import { AgentType, type LLMAgent, type TS_Log_Init } from "@pmate/meta"

type Row = { id: string } & Record<string, unknown>

class InMemoryStdTable {
  private readonly rows = new Map<string, Row>()
  private readonly pageSize = 100

  async appendRow<T extends { id: string }>(data: T) {
    this.rows.set(data.id, { ...data })
  }

  async updateRow<T extends { id: string }>(data: Partial<T> & { id: string }) {
    const existing = this.rows.get(data.id)
    if (!existing) {
      return
    }
    this.rows.set(data.id, {
      ...existing,
      ...data,
    })
  }

  async getById<T>(id: string): Promise<T | undefined> {
    return this.rows.get(id) as T | undefined
  }

  async exists(id: string): Promise<boolean> {
    return this.rows.has(id)
  }

  async list<T>(pageNo = 0): Promise<T[]> {
    const items = [...this.rows.values()]
    const start = pageNo * this.pageSize
    return items.slice(start, start + this.pageSize) as T[]
  }
}

export class InMemoryBlockchain {
  private readonly tables = new Map<string, InMemoryStdTable>()
  public readonly logs: TS_Log_Init<unknown>[] = []

  stdTable(topic: string) {
    let table = this.tables.get(topic)
    if (!table) {
      table = new InMemoryStdTable()
      this.tables.set(topic, table)
    }
    return table
  }

  async appendBatch<T>(logs: TS_Log_Init<T>[]) {
    this.logs.push(...(logs as TS_Log_Init<unknown>[]))
  }

  getTable(topic: string) {
    return this.tables.get(topic)
  }
}

export function createSessionResponse(accountId: string) {
  return {
    success: true,
    message: "ok",
    data: {
      identity: { accountId },
      issuedAt: new Date(0).toISOString(),
      expiresAt: new Date(60_000).toISOString(),
    },
  }
}

export function createValidLlmPayload(id = "demo:writer"): LLMAgent {
  return {
    id,
    type: AgentType.LLM,
    accuracy: "medium" as const,
    responseType: "text" as const,
    realtime: false,
    variables: [{ name: "text", type: "text" as const }],
    instruction: "Summarize the text.",
    prompt: "{{text}}",
  }
}
