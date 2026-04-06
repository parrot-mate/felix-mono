import { Blockchain } from "@pmate/blockchain"

const chainId = process.env.BLOCKCHAIN_CHAIN_ID
const baseUrl = process.env.BLOCKCHAIN_BASE_URL
const indexerBaseUrl = process.env.INDEXER_BASE_URL

if (!chainId || !baseUrl || !indexerBaseUrl) {
  throw new Error(
    "BLOCKCHAIN_CHAIN_ID, BLOCKCHAIN_BASE_URL, and INDEXER_BASE_URL are required"
  )
}

export const blockchain = new Blockchain({ chainId, baseUrl, indexerBaseUrl })
