# Agent System

使用 `@pmate/agent-sdk` 构建 agent 并从客户端调用。

## 目录

- [背景](#背景)
- [安装](#安装)
- [构建 Prompt Agent](#构建-prompt-agent)
- [构建 Stream Agent](#构建-stream-agent)
- [Prompt 与 Stream 的选择](#prompt-与-stream-的选择)
- [从手写 Echo Agent 迁移](#从手写-echo-agent-迁移)
- [客户端调用 Agent](#客户端调用-agent)
- [可选参数](#可选参数)
- [备注](#备注)

## 背景

团队最初往往用零散的 HTTP 接口或临时的 WebSocket 脚本去调用 agent。单次演示还好，但很快就会出现代码分散、超时策略不一致、进度与最终结果处理各自为政的问题。

`@pmate/agent-sdk` 统一了客户端侧的调用方式。它封装 WebSocket 协议与鉴权流程，并提供一致的 API 来支持一次性调用和流式传输，从而把精力集中在 agent 本身的逻辑上。

对于需要同时运行多个 agent、跟踪进度、并在网络波动时保持稳定体验的应用，SDK 提供了可预期的任务生命周期与超时控制，让集成逻辑更可控。

本文覆盖两部分：
- agent 侧工厂（`createPromptAgent`、`createStreamAgent`）用于快速构建服务端 agent。
- client 侧（`AgentClient`）用于从应用端调用 agent。

## 安装

```bash
pnpm add @pmate/agent-sdk
```

## 构建 Prompt Agent

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

## 构建 Stream Agent

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

## Prompt 与 Stream 的选择

- 输入是一次性 JSON 请求，选择 `createPromptAgent`。
- 输入是多段数据流（音频/二进制/分段文本），选择 `createStreamAgent`。
- 如果两种都需要，建议用两个不同 `agentId` 的 agent 分别处理。

## 从手写 Echo Agent 迁移

- 将手写 WebSocket 协议处理迁移到工厂回调（`onPrompt` 或 `onStream`）。
- 协议层 Start/Data/End 由 SDK 统一处理。
- 业务逻辑保留在回调内部，逐步替换。

## 客户端调用 Agent

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

## 可选参数

- Agent 工厂：
- `wsUrl`: agent hub 地址（必填）。
- `agentId`: 用于鉴权与路由的 agent 标识（必填）。
- `token`: 鉴权 token（可选，默认空字符串）。
- `heartbeatIntervalMs`: 心跳间隔毫秒数（默认 `30000`，传 `0` 可关闭）。
- Client：
- `baseUrl`: agent hub 地址（必填）。
- `timeoutMs`: 一次性方法（`prompt`、`generateImage`、`echo`）超时（默认 `40000`）。
- `streamTimeoutMs`: `stream` 的超时（默认 `120000`）。
- `minChunkSizeBytes`: 发送流数据前的最小分片大小（默认 `1048576`）。

## 备注

- `createPromptAgent` 和 `createStreamAgent` 提供 `start()`、`stop()`、`isRunning()` 生命周期方法。
- 两个工厂都通过 `EmitterV2` 提供事件：`connected`、`disconnected`、`task:start`、`task:end`、`error`。
- 在调用 `prompt()`、`generateImage()`、`echo()` 或 `stream()` 之前需要先 `login()`。
- 一次性方法仅支持 JSON（只发送一条 start 消息）；Blob/二进制输入请使用 `stream()`。
- 一次性方法超时会返回 `null`。
- `stream()` 返回的 `AsyncStream` 会产出 `{ type: "progress" }` 与 `{ type: "final" }` 事件。
