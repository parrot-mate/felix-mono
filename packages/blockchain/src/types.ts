import type { TS_Log } from "./metaTypes"

export type ApiResponse<T> = {
  success: boolean
  data?: T
  message?: string
}

export type Block = {
  block_timestamp: number
  id: number
  logs: TS_Log<any>[]
  chain_id: string
}

export type ChainInfo = {
  id: string
  block_time: number
  max_block_size: number
  latest_block_id: number
}
