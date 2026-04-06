# How to use DB?

How to read and write data during development using `@pmate/blockchain`.

## Table of Contents

- [Background](#background)
- [Install](#install)
- [Env (required when using the Blockchain client)](#env-required-when-using-the-blockchain-client)
- [Endpoints](#endpoints)
- [Write + read with a table](#write-read-with-a-table)
- [Write + read with a map](#write-read-with-a-map)
- [Streaming logs](#streaming-logs)
- [Todos demo](#todos-demo)
- [Tips](#tips)

## Background

App teams often need a simple, consistent way to write structured data without setting up a full SQL/ORM stack for every service. `@pmate/blockchain` provides a lightweight log-based store plus indexer queries so you can write data and read it back by topic.

It is designed for app-layer development: you emit logs to a chain service and read back indexed views (tables or maps) from the indexer service. This keeps the write path append-only and the read path query-friendly.

Using the same API across services reduces glue code and encourages consistent topic naming. It also makes it easy to build prototypes or microservices without pulling in a full database stack.

In short: treat the chain as the source of truth for writes, and the indexer as the read layer you query in your application.

### Storage, HA, and read/write separation

The pmate DB model is intentionally split:

- The **chain service** persists blocks (append-only logs). It is optimized for durability and sequential writes.
- The **indexer service** builds query-friendly views (tables, maps). It is optimized for reads and can be rebuilt from chain logs.

This implies eventual consistency: a successful write means the chain accepted your log, but the indexer may take a short time to catch up.

Practical examples:

1. **Fresh read after write**: append a row, then poll `getById` until it appears (or wait for a block + indexer interval).
2. **Indexer outage**: writes can continue; reads may return stale data until the indexer resumes and catches up.
3. **Rebuild**: if an index is corrupted or needs new behavior, you can rebuild it from chain logs without changing the write path.

## Install

```bash
pnpm add @pmate/blockchain
```

## Env (required when using the Blockchain client)

Set these in `.env.local` (or your runtime env) only if your service instantiates `Blockchain`:

- `BLOCKCHAIN_BASE_URL`: base URL for the chain log service.
- `BLOCKCHAIN_CHAIN_ID`: chain id.
- `INDEXER_BASE_URL`: base URL for the indexer.

## Endpoints

Use the following endpoints in development or staging:

- Mainnet (internal only)
  - Blockchain: `http://infra01:6801`
  - Indexer: `https://indexer.pmate.chat`
  - Chain ID: `pmate`
- Testnet
  - Blockchain: `https://qablk01.pmate.chat`
  - Indexer: `https://qaidx.pmate.chat`
  - Chain ID: `pmate-test`

## Write + read with a table

Create a `Blockchain` instance and use `stdTable` for table access:

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
  title: "Ship onboarding docs",
  done: false,
})

await todos.updateRow<Todo>({
  id: "todo_1",
  title: "Ship onboarding docs",
  done: true,
})

const page0 = await todos.list<Todo>(0)
const todo = await todos.getById<Todo>("todo_1")
const exists = await todos.exists("todo_1")
const tables = await todos.listTables()
```

### Topic naming standard

Use a two-level topic name: `@pmate/<name>`.

Examples:

- `@pmate/todos` (app: `@pmate`, table: `todos`)
- `@pmate/user_profiles`
- `@pmate/account`

This keeps topics stable and prevents collisions.

### List table topics

If you need all known table topics from the indexer, call `listTables()` on any `StdTable` instance:

```ts
const tables = await todos.listTables()
```

## Write + read with a map

Use `stdMap` for key/value access:

```ts
const settings = blockchain.stdMap("@pmate/app_settings")

await settings.set("theme", "dark")
const theme = await settings.get<string>("theme")
```

## Streaming logs

When you need an event stream, use `blockchain.logs()`:

```ts
for await (const log of blockchain.logs()) {
  console.log("log", log)
}
```

## Todos demo

There is a runnable todos demo in this repo:

- Service: `apps/todos`
- Entry: `apps/todos/src/index.ts`
- Repo: `https://github.com/parrot-mate/pmate/tree/main/apps/todos`

It demonstrates how to initialize `Blockchain`, use `stdTable` to append rows, and read them back via the indexer. It also shows how to expose a small REST API for CRUD operations on top of `StdTable`.

## Tips

- Writes are appended and indexed asynchronously. If you need fresh reads after a write, wait for at least one block to be produced (the default `append()` waits for one block).
- Keep topics stable (`todos`, `app_settings`) so indexer queries remain predictable.
