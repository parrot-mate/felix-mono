import { describe, expect, it } from "vitest"
import { Blockchain } from "../blockchain"
import { IndexerRestClient } from "../indexer/IndexerRestClient"

type TestRow = {
  id: string
  label?: string
  version?: number
}

const chainId = (process.env.BLOCKCHAIN_CHAIN_ID as "pmate" | undefined) || "pmate"
const blockchainBaseUrl = process.env.BLOCKCHAIN_BASE_URL || "http://infra01:6801"
const indexerBaseUrl = process.env.INDEXER_BASE_URL || "https://indexer.pmate.chat"

describe("StdTable c2c", () => {
  it(
    "materializes create/update/delete flows without duplicate rows",
    async () => {
      const topic = `@pmate/table-c2c-${Date.now()}`
      const row1 = `row-${Date.now()}-1`
      const row2 = `row-${Date.now()}-2`

      const blockchain = new Blockchain({
        chainId,
        baseUrl: blockchainBaseUrl,
        indexerBaseUrl,
      })
      const indexer = new IndexerRestClient({ baseUrl: indexerBaseUrl })
      const table = blockchain.stdTable(topic)

      await table.appendRow<TestRow>({ id: row1, label: "alpha", version: 1 })
      await table.appendRow<TestRow>({ id: row2, label: "beta", version: 1 })
      await table.updateRow<TestRow>({ id: row1, version: 2 })
      await table.updateRow<TestRow>({ id: row1, label: "alpha-v3", version: 3 })

      await waitFor(async () => {
        const [list, count, materialized] = await Promise.all([
          table.list<TestRow>(0),
          readCount(indexer, topic),
          table.getById<TestRow>(row1),
        ])

        expect(count.totalRecord).toBe(2)
        expect(list).toHaveLength(2)
        expect(new Set(list.map((row) => row.id)).size).toBe(2)
        expect(list.filter((row) => row.id === row1)).toHaveLength(1)
        expect(materialized).toEqual({
          id: row1,
          label: "alpha-v3",
          version: 3,
        })
      })

      await table.deleteRow(row1)

      await waitFor(async () => {
        const [list, count, exists, deletedRow, survivingRow] = await Promise.all([
          table.list<TestRow>(0),
          readCount(indexer, topic),
          table.exists(row1),
          table.getById<TestRow>(row1),
          table.getById<TestRow>(row2),
        ])

        expect(count.totalRecord).toBe(1)
        expect(exists).toBe(false)
        expect(deletedRow).toBeUndefined()
        expect(survivingRow).toEqual({
          id: row2,
          label: "beta",
          version: 1,
        })
        expect(list).toEqual([
          {
            id: row2,
            label: "beta",
            version: 1,
          },
        ])
      })
    },
    60_000
  )
})

async function readCount(indexer: IndexerRestClient, topic: string) {
  return indexer.request<{ totalPage: number; totalRecord: number }>(
    chainId,
    "table_indexer",
    "count",
    {
      query: { topic },
    }
  )
}

async function waitFor(
  assertion: () => Promise<void>,
  options: { timeoutMs?: number; intervalMs?: number } = {}
) {
  const timeoutMs = options.timeoutMs ?? 30_000
  const intervalMs = options.intervalMs ?? 1_500
  const deadline = Date.now() + timeoutMs
  let lastError: unknown

  while (Date.now() <= deadline) {
    try {
      await assertion()
      return
    } catch (error) {
      lastError = error
      await new Promise((resolve) => setTimeout(resolve, intervalMs))
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Timed out waiting for StdTable c2c assertion")
}
