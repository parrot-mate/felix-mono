import { TS_Log_Init } from "./metaTypes"
import type { ApiResponse, Block, ChainInfo } from "./types"

export class BlockLogAppender {
  constructor(
    private chainId: string,
    private baseUrl: string
  ) {
    this.baseUrl = this.baseUrl.replace(/\/$/, "")
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    if (process.env.TSDB_BEARER_TOKEN) {
      headers["authorization"] = `Bearer ${process.env.TSDB_BEARER_TOKEN}`
    }
    return headers
  }

  private async post(path: string, body: any): Promise<void> {
    const url = `${this.baseUrl}${path}`
    console.log("TSDB POST", url, body)
    let response: Response
    try {
      response = await fetch(url, {
        method: "POST",
        headers: this.buildHeaders(),
        body: JSON.stringify(body),
      })
    } catch (error) {
      console.error("TSDB POST ERROR", url, body, error)
      throw error
    }
    if (!response.ok) {
      console.error("TSDB POST ERROR", url, body, response.status)
      throw new Error(
        `TSDB request failed: ${response.status} ${response.statusText}`
      )
    }
  }

  private async get<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const response = await fetch(url, {
      headers: this.buildHeaders(),
    })
    const payload = (await response.json()) as ApiResponse<T>
    if (!response.ok) {
      console.error("TSDB GET ERROR", url, response.status, payload)
      throw new Error(
        `TSDB request failed: ${response.status} ${response.statusText}`
      )
    }
    if (!payload?.success) {
      throw new Error(payload?.message ?? "Unknown Error")
    }
    if (payload.data === undefined || payload.data === null) {
      throw new Error("TSDB response missing data")
    }
    return payload.data
  }

  async getChainInfo(): Promise<ChainInfo> {
    return this.get(`/chains/${this.chainId}`)
  }

  async getLatestBlock(): Promise<Block> {
    return this.get(`/chains/${this.chainId}/blocks/latest`)
  }

  async getBlock(blockId: number): Promise<Block> {
    return this.get(`/chains/${this.chainId}/blocks/${blockId}`)
  }

  async append<T>(logs: TS_Log_Init<T>[]): Promise<void> {
    if (!logs.length) return
    await this.post(`/chains/${this.chainId}/logs`, { logs })
  }

  async batchAppend(logs: TS_Log_Init<any>[]): Promise<void> {
    await this.post(`/chains/${this.chainId}/logs`, { logs })
  }
}
