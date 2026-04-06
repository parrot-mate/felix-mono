# How to use DB?

使用 `@pmate/blockchain` 在开发阶段读写数据。

## 目录

- [背景](#背景)
- [安装](#安装)
- [环境变量（仅在使用 Blockchain 客户端时需要）](#环境变量（仅在使用-blockchain-客户端时需要）)
- [Endpoints](#endpoints)
- [用表写入与读取](#用表写入与读取)
- [用 map 写入与读取](#用-map-写入与读取)
- [订阅日志流](#订阅日志流)
- [Todos 示例](#todos-示例)
- [小提示](#小提示)

## 背景

开发阶段往往希望快速写入结构化数据，但不想为每个服务都搭建完整的 SQL/ORM 体系。`@pmate/blockchain` 提供基于日志的写入与索引查询，能用统一方式写数据、读回数据。

它强调应用层使用：写入走链服务，读取走索引服务。这样写入路径保持追加式，读取路径保持查询友好。

统一的 API 能减少不同服务之间的胶水代码，并鼓励规范化的 topic 命名。原型开发或微服务场景下无需引入完整数据库即可快速落地。

简单来说：链服务是写入源，索引服务是读取层。

### 存储、高可用与读写分离

pmate 的“数据库”模型是有意拆分的：

- **链服务**：负责持久化区块（追加写日志），更偏向顺序写入与可靠性。
- **索引服务**：负责构建可查询视图（表、map），更偏向读性能，并且可从链日志重建。

因此读是最终一致性：写入成功意味着链服务接受了日志，但索引可能需要一小段时间才能查询到。

实践示例（建议按需求选择）：

1. **写后读**：append 成功后，若需要立刻读到，轮询 `getById` 直到出现（或等待一个区块 + indexer 轮询周期）。
2. **索引不可用**：写入通常仍可继续，但读取会滞后；索引恢复后会自动追上链上的新日志。
3. **索引重建**：当索引逻辑升级或索引数据异常时，可从链日志重建索引，而不需要改变写入路径。

## 安装

```bash
pnpm add @pmate/blockchain
```

## 环境变量（仅在使用 Blockchain 客户端时需要）

仅当服务端代码中实例化 `Blockchain` 时，才需要在 `.env.local` 或运行环境中设置：

- `BLOCKCHAIN_BASE_URL`：链日志服务地址。
- `BLOCKCHAIN_CHAIN_ID`：链 id。
- `INDEXER_BASE_URL`：indexer 服务地址。

## Endpoints

开发或联调时可使用以下地址：

- 主网（仅内网可访问）
  - Blockchain：`http://infra01:6801`
  - Indexer：`https://indexer.pmate.chat`
  - Chain ID：`pmate`
- 测试网
  - Blockchain：`https://qablk01.pmate.chat`
  - Indexer：`https://qaidx.pmate.chat`
  - Chain ID：`pmate-test`

## 用表写入与读取

先创建 `Blockchain` 实例，再使用 `stdTable` 访问表：

```ts
import { Blockchain } from "@pmate/blockchain"

type Todo = {
  id: string
  title: string
  done: boolean
}

const blockchain = new Blockchain({
  chainId: process.env.BLOCKCHAIN_CHAIN_ID!,
  baseUrl: process.env.BLOCKCHAIN_BASE_URL!,
  indexerBaseUrl: process.env.INDEXER_BASE_URL!,
})
const todos = blockchain.stdTable("@pmate/todos")

await todos.appendRow<Todo>({
  id: "todo_1",
  title: "完成新手文档",
  done: false,
})

await todos.updateRow<Todo>({
  id: "todo_1",
  title: "完成新手文档",
  done: true,
})

const page0 = await todos.list<Todo>(0)
const todo = await todos.getById<Todo>("todo_1")
const exists = await todos.exists("todo_1")
const tables = await todos.listTables()
```

### Topic 命名规范

采用两级命名：`@pmate/<name>`。

示例：

- `@pmate/todos`（app: `@pmate`，table: `todos`）
- `@pmate/user_profiles`
- `@pmate/account`

这样可以保持 topic 稳定，避免冲突。

### 列出已有表 topic

如果需要获取 indexer 已知的所有表 topic，可以在任意 `StdTable` 实例上调用 `listTables()`：

```ts
const tables = await todos.listTables()
```

## 用 map 写入与读取

`stdMap` 适合 key/value 访问：

```ts
const settings = blockchain.stdMap("@pmate/app_settings")

await settings.set("theme", "dark")
const theme = await settings.get<string>("theme")
```

## 订阅日志流

需要事件流时使用 `blockchain.logs()`：

```ts
for await (const log of blockchain.logs()) {
  console.log("log", log)
}
```

## Todos 示例

仓库内提供了一个可运行的 todos 示例：

- 服务：`apps/todos`
- 入口：`apps/todos/src/index.ts`
- 链接：`https://github.com/parrot-mate/pmate/tree/main/apps/todos`

该示例展示了如何初始化 `Blockchain`，使用 `stdTable` 追加与读取数据，并基于 `StdTable` 封装一个简单的 REST API。

## 小提示

- 写入后需要等待索引更新；默认 `append()` 会等待 1 个区块生成。
- topic 建议固定命名（如 `todos`、`app_settings`），便于 indexer 查询。
