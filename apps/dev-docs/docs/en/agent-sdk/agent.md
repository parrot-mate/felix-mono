# Agent System

Build agents and run clients with `@pmate/agent-sdk`.

## Table of Contents

- [Background](#background)
- [Install](#install)
- [Build a Prompt Agent](#build-a-prompt-agent)
- [Build a Stream Agent](#build-a-stream-agent)
- [Prompt vs Stream](#prompt-vs-stream)
- [Migration from Manual Echo Agent](#migration-from-manual-echo-agent)
- [Run Agents from Client](#run-agents-from-client)
- [Options](#options)
- [Notes](#notes)

## Background

Teams often start by invoking agents through ad-hoc HTTP endpoints or one-off WebSocket scripts. That usually works for a single demo, but it quickly turns into scattered code paths, inconsistent timeouts, and no shared way to handle progress vs. final results.

`@pmate/agent-sdk` standardizes the client-side contract for running agents. It wraps the WebSocket protocol, handles authentication, and surfaces a unified API for both one-shot runs and streaming workloads, so you can focus on your agent logic instead of plumbing.

The SDK is designed for apps that need to run multiple agents, track their progress, and recover from transient network issues. It gives you a predictable task lifecycle and consistent timeouts for each request type.

This doc covers both sides:
- agent runtime factories (`createPromptAgent`, `createStreamAgent`) for building agents.
- client runtime (`AgentClient`) for calling those agents.

## Install

```bash
pnpm add @pmate/agent-sdk
```

## Build a Prompt Agent

```ts
import { createPromptAgent } from "@pmate/agent-sdk"

const agent = createPromptAgent({
  wsUrl: "wss://hub.pmate.chat",
  agentId: "agent:summary",
  token: process.env.PMATE_TOKEN,
  async onPrompt(ctx) {
    const { payload } = ctx.start()
    return {
      ok: true,
      echo: payload,
    }
  },
})

await agent.start()
```

## Build a Stream Agent

```ts
import { createStreamAgent } from "@pmate/agent-sdk"

const agent = createStreamAgent({
  wsUrl: "wss://hub.pmate.chat",
  agentId: "agent:transcribe",
  token: process.env.PMATE_TOKEN,
  async onStream(ctx) {
    const { params } = ctx.start()
    let text = ""

    for await (const chunk of ctx.chunks.text()) {
      text += chunk
      await ctx.progress({ received: text.length })
    }

    return {
      params,
      text,
    }
  },
})

await agent.start()
```

## Prompt vs Stream

- Use `createPromptAgent` when each task is one-shot JSON input.
- Use `createStreamAgent` when each task has multiple data chunks (audio, binary, or progressive text).
- If your workload needs both, run two agents with different `agentId` values.

## Migration from Manual Echo Agent

- Replace manual WebSocket handling with factory handlers (`onPrompt` or `onStream`).
- Keep protocol behavior (`Start/Data/End`) handled by the SDK.
- Keep your existing business logic inside the handler body.

## Run Agents from Client

```ts
import { AgentClient, AsyncStream } from "@pmate/agent-sdk"

const client = new AgentClient({
  baseUrl: "wss://hub.pmate.chat",
  streamTimeoutMs: 120_000,
})

await client.login("your-app-id", {
  token: process.env.PMATE_TOKEN,
})

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

client.close()
```

## Options

- Agent factories:
- `wsUrl`: Agent hub endpoint (required).
- `agentId`: Agent ID for auth and routing (required).
- `token`: Auth token (optional, defaults to empty string).
- `heartbeatIntervalMs`: Ping interval in milliseconds (defaults to `30000`, set `0` to disable).
- Client:
- `baseUrl`: Agent hub endpoint (required).
- `timeoutMs`: Timeout for one-shot tasks (`prompt`, `generateImage`, `echo`) (defaults to `40000`).
- `streamTimeoutMs`: Timeout for `stream` tasks (defaults to `120000`).
- `minChunkSizeBytes`: Minimum chunk size before sending streaming data (defaults to `1048576`).

## Notes

- `createPromptAgent` and `createStreamAgent` expose lifecycle methods: `start()`, `stop()`, `isRunning()`.
- Both factories expose runtime events via `EmitterV2`: `connected`, `disconnected`, `task:start`, `task:end`, `error`.
- Call `login()` once per client before `prompt()`, `generateImage()`, `echo()`, or `stream()`.
- One-shot methods are JSON-only (single start message). Use `stream()` for blob/binary input.
- One-shot methods resolve to the final agent response or `null` if timed out.
- `stream()` returns an `AsyncStream` that yields `{ type: "progress" }` and `{ type: "final" }` events.
