import {
  BizErrorCode,
  TS_LogKind,
  type Agent,
  type ASRAgent,
  type AgentNamespaceRecord,
  type AgentRecord,
  type AgentRegistryStatus,
  type CreateAgentInput,
  type EchoAgent,
  type LLMAgent,
  type TTSAgent,
  type TranslationAgent,
  type UpdateAgentInput,
  type Variable,
  type TS_Log_Init,
  AgentType,
} from "@pmate/meta"
import { ServiceError } from "@pmate/service-core"
import { type StdTableUpdateInput } from "@pmate/blockchain"

const NAMESPACE_TOPIC = "@pmate/agent-namespaces"
const AUDIT_TOPIC = "@pmate/agent-audit"

type AgentAuditLog = {
  action: "agent.created" | "agent.updated" | "agent.disabled"
  agentId: string
  namespace: string
  name: string
  actorAccountId: string
  at: number
  requestId?: string
  changes?: Record<string, unknown>
}

type StdTableLike = {
  appendRow<T>(data: T & { id: string }): Promise<void>
  updateRow<T>(data: Partial<T> & { id: string }): Promise<void>
  getById<T>(id: string): Promise<T | undefined>
  exists(id: string): Promise<boolean>
  list<T>(pageNo?: number): Promise<T[]>
}

type RegistryBlockchain = {
  stdTable(topic: string): StdTableLike
  appendBatch<T>(logs: TS_Log_Init<T>[], options?: { waitForBlockTime?: number }): Promise<void>
}

export class AgentRegistryService {
  private readonly namespaceTable: StdTableLike

  constructor(private readonly chain: RegistryBlockchain) {
    this.namespaceTable = this.chain.stdTable(NAMESPACE_TOPIC)
  }

  async listAgents(namespace?: string): Promise<AgentRecord[]> {
    if (namespace) {
      return this.listAgentsByNamespace(namespace)
    }

    const namespaces = await this.listNamespaces()
    const records = await Promise.all(
      namespaces
        .filter((item) => item.status === "active")
        .map((item) => this.listAgentsByNamespace(item.namespace))
    )
    return records.flat()
  }

  async getAgent(namespace: string, name: string): Promise<AgentRecord | undefined> {
    const normalizedNamespace = assertNamespace(namespace)
    const normalizedName = assertName(name)
    return this.agentTable(normalizedNamespace).getById<AgentRecord>(
      toAgentId(normalizedNamespace, normalizedName)
    )
  }

  async createAgent(
    namespace: string,
    input: CreateAgentInput,
    actorAccountId: string,
    requestId?: string
  ): Promise<AgentRecord> {
    const normalizedNamespace = assertNamespace(namespace)
    const normalizedName = assertName(input.name)
    const id = toAgentId(normalizedNamespace, normalizedName)
    const existing = await this.agentTable(normalizedNamespace).exists(id)
    if (existing) {
      throw new ServiceError("Agent already exists", 409, BizErrorCode.AUTH_ERROR)
    }

    const now = Date.now()
    const payload = normalizeAgent(input.payload, id)
    const record: AgentRecord = {
      id,
      namespace: normalizedNamespace,
      name: normalizedName,
      status: "active",
      payload,
      version: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: actorAccountId,
      updatedBy: actorAccountId,
      tags: sanitizeTags(input.tags),
      description: sanitizeOptionalString(input.description),
    }

    await this.ensureNamespace(normalizedNamespace, actorAccountId, now)
    await this.agentTable(normalizedNamespace).appendRow(record)
    await this.appendAuditLog({
      action: "agent.created",
      agentId: record.id,
      namespace: record.namespace,
      name: record.name,
      actorAccountId,
      at: now,
      requestId,
    })
    return record
  }

  async updateAgent(
    namespace: string,
    name: string,
    input: UpdateAgentInput,
    actorAccountId: string,
    requestId?: string
  ): Promise<AgentRecord> {
    const record = await this.getRequiredAgent(namespace, name)
    if (input.version !== undefined && input.version !== record.version) {
      throw new ServiceError("Agent version mismatch", 409, BizErrorCode.AUTH_ERROR)
    }

    const nextVersion = record.version + 1
    const now = Date.now()
    const nextPayload =
      input.payload !== undefined
        ? normalizeAgent(input.payload, record.id)
        : record.payload
    const nextStatus = normalizeStatus(input.status) ?? record.status
    const nextTags = input.tags !== undefined ? sanitizeTags(input.tags) : record.tags
    const nextDescription =
      input.description !== undefined
        ? sanitizeOptionalString(input.description)
        : record.description

    const update: StdTableUpdateInput<AgentRecord> = {
      id: record.id,
      payload: nextPayload,
      status: nextStatus,
      tags: nextTags,
      description: nextDescription,
      updatedAt: now,
      updatedBy: actorAccountId,
      version: nextVersion,
    }
    await this.agentTable(record.namespace).updateRow(update)

    const nextRecord: AgentRecord = {
      ...record,
      payload: nextPayload,
      status: nextStatus,
      tags: nextTags,
      description: nextDescription,
      updatedAt: now,
      updatedBy: actorAccountId,
      version: nextVersion,
    }

    await this.appendAuditLog({
      action: nextStatus === "disabled" ? "agent.disabled" : "agent.updated",
      agentId: nextRecord.id,
      namespace: nextRecord.namespace,
      name: nextRecord.name,
      actorAccountId,
      at: now,
      requestId,
      changes: {
        status: nextStatus,
        version: nextVersion,
      },
    })

    return nextRecord
  }

  async disableAgent(
    namespace: string,
    name: string,
    actorAccountId: string,
    requestId?: string
  ): Promise<AgentRecord> {
    return this.updateAgent(
      namespace,
      name,
      { status: "disabled" },
      actorAccountId,
      requestId
    )
  }

  async listNamespaces(): Promise<AgentNamespaceRecord[]> {
    return this.listAll<AgentNamespaceRecord>(this.namespaceTable)
  }

  private async listAgentsByNamespace(namespace: string): Promise<AgentRecord[]> {
    const normalizedNamespace = assertNamespace(namespace)
    return this.listAll<AgentRecord>(this.agentTable(normalizedNamespace))
  }

  private async ensureNamespace(namespace: string, actorAccountId: string, now: number) {
    if (await this.namespaceTable.exists(namespace)) {
      return
    }

    const record: AgentNamespaceRecord = {
      id: namespace,
      namespace,
      createdAt: now,
      updatedAt: now,
      createdBy: actorAccountId,
      updatedBy: actorAccountId,
      status: "active",
    }
    await this.namespaceTable.appendRow(record)
  }

  private async getRequiredAgent(namespace: string, name: string): Promise<AgentRecord> {
    const record = await this.getAgent(namespace, name)
    if (!record) {
      throw new ServiceError("Agent not found", 404, BizErrorCode.AUTH_ERROR)
    }
    return record
  }

  private agentTable(namespace: string) {
    return this.chain.stdTable(namespaceTopic(namespace))
  }

  private async listAll<T>(table: StdTableLike): Promise<T[]> {
    const records: T[] = []
    for (let page = 0; page < 200; page += 1) {
      const items = await table.list<T>(page)
      if (!items.length) break
      records.push(...items)
    }
    return records
  }

  private async appendAuditLog(log: AgentAuditLog) {
    const entry: TS_Log_Init<AgentAuditLog> = {
      kind: TS_LogKind.APP_LOG,
      topic: AUDIT_TOPIC,
      data: log,
    }
    await this.chain.appendBatch([entry], { waitForBlockTime: 0 })
  }
}

function toAgentId(namespace: string, name: string) {
  return `${namespace}:${name}`
}

function namespaceTopic(namespace: string) {
  return `@pmate/agent-${assertNamespace(namespace)}`
}

function assertNamespace(value: string) {
  const normalized = value.trim().toLowerCase()
  if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(normalized)) {
    throw new ServiceError(
      "Invalid namespace. Use lowercase letters, numbers, and dashes only.",
      400,
      BizErrorCode.AUTH_ERROR
    )
  }
  return normalized
}

function assertName(value: string) {
  const normalized = value.trim().toLowerCase()
  if (!/^[a-z0-9][a-z0-9-_]{0,62}$/.test(normalized)) {
    throw new ServiceError(
      "Invalid agent name. Use lowercase letters, numbers, dashes, and underscores only.",
      400,
      BizErrorCode.AUTH_ERROR
    )
  }
  return normalized
}

function sanitizeTags(value: string[] | undefined) {
  if (value === undefined) return undefined
  if (!Array.isArray(value)) {
    throw new ServiceError("tags must be an array of strings", 400, BizErrorCode.AUTH_ERROR)
  }
  return value
    .map((item) => {
      if (typeof item !== "string") {
        throw new ServiceError("tags must be an array of strings", 400, BizErrorCode.AUTH_ERROR)
      }
      return item.trim()
    })
    .filter(Boolean)
}

function sanitizeOptionalString(value: string | undefined) {
  if (value === undefined) return undefined
  if (typeof value !== "string") {
    throw new ServiceError("Expected a string value", 400, BizErrorCode.AUTH_ERROR)
  }
  const normalized = value.trim()
  return normalized || undefined
}

function normalizeStatus(status: AgentRegistryStatus | undefined) {
  if (status === undefined) return undefined
  if (status !== "active" && status !== "disabled") {
    throw new ServiceError("Invalid status", 400, BizErrorCode.AUTH_ERROR)
  }
  return status
}

function normalizeAgent(input: Agent, id: string): Agent {
  const base = input as unknown as Record<string, unknown>
  const type = base.type
  if (!type || typeof type !== "string") {
    throw new ServiceError("Agent payload.type is required", 400, BizErrorCode.AUTH_ERROR)
  }

  switch (type) {
    case AgentType.LLM:
      assertString(base.accuracy, "payload.accuracy")
      assertString(base.responseType, "payload.responseType")
      assertBoolean(base.realtime, "payload.realtime")
      assertVariables(base.variables)
      assertString(base.instruction, "payload.instruction")
      assertString(base.prompt, "payload.prompt")
      return {
        ...(base as unknown as LLMAgent),
        id,
        type: AgentType.LLM,
      }
    case AgentType.ASR:
      assertString(base.latency, "payload.latency")
      return {
        ...(base as unknown as ASRAgent),
        id,
        type: AgentType.ASR,
      }
    case AgentType.TTS:
      return {
        ...(base as unknown as TTSAgent),
        id,
        type: AgentType.TTS,
      }
    case AgentType.Translation:
      return {
        ...(base as unknown as TranslationAgent),
        id,
        type: AgentType.Translation,
      }
    case AgentType.ECHO:
      return {
        ...(base as unknown as EchoAgent),
        id,
        type: AgentType.ECHO,
      }
    default:
      throw new ServiceError(
        `Unsupported agent type "${String(type)}"`,
        400,
        BizErrorCode.AUTH_ERROR
      )
  }
}

function assertString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new ServiceError(`${field} must be a non-empty string`, 400, BizErrorCode.AUTH_ERROR)
  }
}

function assertBoolean(value: unknown, field: string) {
  if (typeof value !== "boolean") {
    throw new ServiceError(`${field} must be a boolean`, 400, BizErrorCode.AUTH_ERROR)
  }
}

function assertVariables(value: unknown): asserts value is Variable[] {
  if (!Array.isArray(value)) {
    throw new ServiceError("payload.variables must be an array", 400, BizErrorCode.AUTH_ERROR)
  }
  for (const item of value) {
    if (!item || typeof item !== "object") {
      throw new ServiceError(
        "payload.variables items must be objects",
        400,
        BizErrorCode.AUTH_ERROR
      )
    }
    const variable = item as Record<string, unknown>
    assertString(variable.name, "payload.variables[].name")
    assertString(variable.type, "payload.variables[].type")
  }
}
