# How to use AgentClient?

Use `@pmate/agent-sdk` to connect, authenticate, and run agents from your app.

## Table of Contents

- [Background](#background)
- [Install](#install)
- [Create a client](#create-a-client)
- [Run an agent once](#run-an-agent-once)
- [Stream data to an agent](#stream-data-to-an-agent)
- [Options](#options)
- [Notes](#notes)

## Background

Many starter projects begin by calling agents through custom WebSocket code or ad-hoc HTTP handlers. That usually works for a demo, but it spreads connection logic, auth handling, and timeout behavior across multiple code paths.

`AgentClient` provides a single, consistent workflow for connecting to the hub, authenticating, and running agent tasks. It keeps the integration predictable so you can focus on how your app supplies input and consumes progress or final output.

## Install

```bash
pnpm add @pmate/agent-sdk
```

## Create a client

```ts
import { AgentClient } from "@pmate/agent-sdk"

const client = new AgentClient({
  baseUrl: "wss://hub.pmate.chat",
})

await client.login("your-app-id", {
  token: process.env.PMATE_TOKEN,
})
```

## Run an agent once

```ts
const result = await client.prompt({
  agentId: "agent:summary",
  payload: { language: "en", text: "Hello agent" },
})

console.log("final", result)
```

## Stream data to an agent

```ts
import { AsyncStream } from "@pmate/agent-sdk"

const input = new AsyncStream<Blob>()
const agentStream = client.stream({
  agentId: "agent:transcribe",
  stream: input,
  params: { language: "en" },
})

;(async () => {
  for await (const event of agentStream) {
    if (event.type === "progress") {
      console.log("progress", event.data)
    } else {
      console.log("final", event.data)
    }
  }
})()

input.push(new Blob(["chunk-1"]))
input.push(new Blob(["chunk-2"]))
input.end()

const final = await agentStream.finish()
console.log("done", final)
```

## Options

- `baseUrl`: Agent hub endpoint (required).
- `timeoutMs`: Timeout for one-shot tasks (`prompt`, `generateImage`, `echo`) (defaults to `40000`).
- `streamTimeoutMs`: Timeout for `stream()` tasks (defaults to `120000`).
- `minChunkSizeBytes`: Minimum chunk size before sending streaming data (defaults to `1048576`).

## Notes

- Call `login()` before `prompt()`, `generateImage()`, `echo()`, or `stream()`.
- One-shot methods are JSON-only (single start message). Use `stream()` for blob/binary input.
- One-shot methods resolve to the final agent response or `null` on timeout.
- `stream()` yields `{ type: "progress" }` and `{ type: "final" }` events.
- Call `client.close()` when your app is done with the connection.
