declare module "@pmate/agent-sdk" {
  export const AgentService: new (options: {
    agentApiBaseUrl: string
    token: string
  }) => unknown

  export const AgentClient: new (options: {
    baseUrl: string
    agentService: unknown
  }) => {
    login(from: string, options: { token: string }): Promise<void>
    prompt<TFinal>(options: {
      agentId: string
      payload: Record<string, unknown>
    }): Promise<TFinal | { type?: "text" | "json"; content?: TFinal } | null>
    close(): void
  }
}
