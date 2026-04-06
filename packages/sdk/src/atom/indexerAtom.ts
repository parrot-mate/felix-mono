import type { WritableAtom } from "jotai"
import { atom, type PrimitiveAtom } from "jotai"
import { atomFamily, atomWithRefresh } from "jotai/utils"
import { isEqual } from "lodash"
import {
  IndexerDataType,
  IndexerNames,
  IndexerParamType,
  Indexers,
} from "@sdk/util/cindexer.def"

type IndexerAtomParams<TName extends IndexerNames> = {
  name: TName
  userId: string
  params?: IndexerParamType<TName>
}

/**
 * 版本号原子（关键）：同一个 (name,userId,params) 对应一个版本号。
 * 每次 bump 都会让依赖它的 atom 重新计算（从而"真刷新"）。
 */
const indexerVersionFamily = atomFamily(
  <TName extends IndexerNames>(_key: IndexerAtomParams<TName>) => atom(0),
  isEqual
)

/**
 * 依赖版本号,在 refresh 时 bump 版本，就会触发重新 fetch。
 */
const _indexerCoreFamily = atomFamily(
  <TName extends IndexerNames>(key: IndexerAtomParams<TName>) =>
    atomWithRefresh(async (get) => {
      // 依赖版本号，变化时重算
      get(indexerVersionFamily(key))

      const indexer = Indexers[key.name].create(key.userId)
      await indexer.init()
      return indexer.fetch(key.params as any)
    }),
  isEqual
)

export const indexerAtom = <TName extends IndexerNames>(
  name: TName,
  userId: string,
  params?: IndexerParamType<TName>
) =>
  _indexerCoreFamily({ name, userId, params }) as WritableAtom<
    Promise<IndexerDataType<TName>>,
    [],
    void
  >

export const getIndexer = <T extends IndexerNames>(name: T, userId: string) => {
  return Indexers[name].create(userId)
}

/**
 * 更新索引 + 失效依赖
 *
 * 语义：
 * 1) 调用具体 Indexer.updateToLatest()，从服务端拉取最新数据并重建索引
 * 2) bump 版本号，触发依赖本 indexer 的 atom（例如 threadsAtomV2）重新计算
 */
export const updateIndexerAtom = <TName extends IndexerNames>(
  name: TName,
  userId: string,
  params?: IndexerParamType<TName>
) =>
  atom(null, async (_get, set) => {
    const key: IndexerAtomParams<TName> = { name, userId, params }
    const indexer = Indexers[name].create(userId)

    // 让具体 Indexer 从服务端拉取最新数据并重建
    await indexer.updateToLatest()

    // bump 版本号 → 触发 _indexerCoreFamily 重新 fetch
    const verAtom: PrimitiveAtom<number> = indexerVersionFamily(key)
    set(verAtom, (v) => v + 1)
  })
