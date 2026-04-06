# 后端教程（面向 Agent UI 调试）

## Background/背景

Agent UI 的联调经常卡在后端服务未启动、环境变量不匹配、或接口域名指向错误上，导致前端页面表现“像是坏掉了”但实际是后端不可用。缺少一份简单明确的后端启动指引，会拖慢功能验证和问题定位。

这份教程的目标是建立最短路径：选定后端服务、正确配置环境变量、启动服务并完成基本连通性验证。内容聚焦本仓库内的后端应用，不涉及外部基础设施的深度运维细节。

## 适用范围

- 需要联调 `agent-ui` 的后端服务
- 需要本地启动或验证 API 可用性

## 快速开始

1. 选择目标后端应用（示例：`apps/agent-api`、`apps/chat-rest`、`apps/log-api`、`apps/auth-api`）。
2. 确认该应用在 `package.json` 中的脚本（通常有 `dev` / `start` / `build`）。
3. 启动服务：

```bash
pnpm --filter <app-name> dev
```

> 例：`pnpm --filter chat-rest dev`

## 环境变量

后端服务通常依赖以下类环境变量（具体以应用的 `package.json` / `README` 为准）：

- 服务端口（如 `PORT`、`AGENT_UI_API_PORT`）
- 数据库连接（如 `DATABASE_URL`）
- 上游 API 域名（如 `CMS_SERVICE_URL`）
- 认证相关（如 `AUTH_SECRET` / `TOKEN_SECRET`）
 - 区块链存储（`BLOCKCHAIN_CHAIN_ID` / `BLOCKCHAIN_BASE_URL` / `INDEXER_BASE_URL`）

建议方式：

- 先查看目标应用目录下是否有 `.env.example` 或 `README`
- 没有的话，查看服务源码中的 `process.env.*` 使用点

## 验证是否可用

1. 本地端口连通：

```bash
curl -I http://localhost:<port>/
```

2. 关键接口连通（示例）：

```bash
curl http://localhost:<port>/health
```

> 如果没有 `/health`，请查找项目内已有的健康检查路由。

## Agent UI API（存储用户日志与会话）

- 应用位置：`apps/agent-api`
- 启动命令：`pnpm --filter @pmate/agent-api dev`
- 默认端口：`5795`（可用 `AGENT_UI_API_PORT` 覆盖）
- 依赖的环境变量：
  - `BLOCKCHAIN_CHAIN_ID`
  - `BLOCKCHAIN_BASE_URL`
  - `INDEXER_BASE_URL`

最小接口：

- `POST /user-actions`：写入用户操作日志（按 `userId` 分 topic）
- `POST /sessions`：写入会话日志（按 `userId` 分 topic）
- `GET /ok`：健康检查

## 与 Agent UI 的联调

Agent UI 使用环境变量指定后端域名，常见变量在 `apps/agent-ui` 的构建输出中可见，如：

- `VITE_PUBLIC_CMS_SERVICE`
- `VITE_PUBLIC_AUTH_SERVER_ENDPOINT`

联调时请确保这些变量指向你启动的本地服务地址（或可用的测试环境）。

## 常见问题

- **启动失败**：先检查端口占用，再检查环境变量是否缺失。
- **接口 401/403**：检查登录态、Token、或服务端鉴权配置。
- **前端有请求但无响应**：用 `curl` 直连接口确认后端是否正常。

## 部署（可选）

若需要把后端部署到 `pmate` 环境，请确保 `.pmate.yaml` 中已配置该服务，并使用：

```bash
pmate init <app-name>
pmate deploy <app-name>
```

> 具体细节以项目运维规范为准。
