# 如何使用 AgentClient？

使用 `@pmate/agent-sdk` 在应用中连接、鉴权并运行 agent。

## 目录

- [背景](#背景)
- [安装](#安装)
- [创建客户端](#创建客户端)
- [一次性运行](#一次性运行)
- [流式传输](#流式传输)
- [可选参数](#可选参数)
- [备注](#备注)

## 背景

很多 starter 项目一开始会用自定义 WebSocket 或零散的 HTTP 方式去调用 agent，短期可行，但连接管理、鉴权与超时策略会散落在多个代码路径中。

`AgentClient` 把连接、鉴权与任务调用收敛为统一流程，确保调用行为一致，帮助你把注意力放在输入数据与结果处理上。

## 安装

```bash
pnpm add @pmate/agent-sdk
```

## 创建客户端

```ts
import { AgentClient } from "@pmate/agent-sdk"

const client = new AgentClient({
  baseUrl: "wss://hub.pmate.chat",
})

await client.login("your-app-id", {
  token: process.env.PMATE_TOKEN,
})
```

## 一次性运行

```ts
const result = await client.prompt({
  agentId: "agent:summary",
  payload: { language: "en", text: "Hello agent" },
})

console.log("final", result)
```

## 流式传输

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

## 可选参数

- `baseUrl`: agent hub 地址（必填）。
- `timeoutMs`: 一次性方法（`prompt`、`generateImage`、`echo`）超时（默认 `40000`）。
- `streamTimeoutMs`: `stream()` 超时（默认 `120000`）。
- `minChunkSizeBytes`: 发送流数据前的最小分片大小（默认 `1048576`）。

## 备注

- 在调用 `prompt()`、`generateImage()`、`echo()` 或 `stream()` 之前需要先 `login()`。
- 一次性方法仅支持 JSON（只发送一条 start 消息）；Blob/二进制输入请使用 `stream()`。
- 一次性方法超时会返回 `null`。
- `stream()` 会产出 `{ type: "progress" }` 与 `{ type: "final" }` 事件。
- 使用完成后调用 `client.close()` 释放连接。
