# Create App: Node

通过 pmate CLI 初始化服务器基础设施并部署 Node 服务。

## 目录

- [背景](#背景)
- [前置条件](#前置条件)
- [在 .pmate.yaml 中添加应用](#在-pmateyaml-中添加应用)
- [第一步：初始化基础设施](#第一步：初始化基础设施)
- [第二步：部署应用](#第二步：部署应用)
- [第三步：验证部署结果](#第三步：验证部署结果)
- [常见后续操作](#常见后续操作)

## 背景

Node 服务上线通常需要服务器、nginx 路由以及稳定的进程重启方式。手动配置容易漏文件或产生环境差异，导致部署失败。

Pmate CLI 读取 `.pmate.yaml`，把服务器与 DNS 的配置统一成一条流程。本指南专注 Node 类型的关键步骤，帮助你快速上线。

## 前置条件

1. 安装 CLI：

```bash
npm i -g @pmate/cli
```

2. 在 `~/.pmate/config` 中配置所需凭证：

```bash
mkdir -p ~/.pmate
cat <<'CONF' > ~/.pmate/config
ALIYUN_AK=your_access_key_id
ALIYUN_SK=your_access_key_secret
OSS_REGION=cn-hangzhou
CONF
```

3. 在仓库根目录创建 `.pmate.yaml` 并配置 Node 应用。
   规范说明见：[https://dev-docs.pmate.chat/cn/pmate-cli/pmate-yaml](https://dev-docs.pmate.chat/cn/pmate-cli/pmate-yaml)。

4. 请遵循 monorepo 应用结构：[/guide/mono-app-structure](/guide/mono-app-structure)。

5. 为应用准备 PM2 配置文件：

- `apps/<app>/ecosystem.config.cjs`
- `apps/<app>/ecosystem.config.js`

6. 若仓库为私有，需要在 `~/.pmate/config` 中配置 GitHub token 以便服务器克隆。

## 在 .pmate.yaml 中添加应用

在仓库根目录的 `.pmate.yaml` 中新增 `node` 类型配置：

```yaml
apps:
  - app: <app-name>
    type: node
    subdomain: <subdomain>
    server: <server-ip-or-host>
    port: 9107
    repository: owner/repo
```

## 第一步：初始化基础设施

```bash
pmate init <app-name>
```

行为说明：

- 根据 `serviceType`（`rest` 或 `ws`）上传 nginx 配置到服务器。
- 重载 nginx，并为 `<subdomain>.pmate.chat` 添加 A 记录。

## 第二步：部署应用

```bash
pmate deploy <app-name>
```

行为说明：

- SSH 登录 `pmate@<server>`，拉取仓库并安装依赖。
- 读取 PM2 配置文件，用 `PORT=<port>` 启动或重载服务。

## 第三步：验证部署结果

在浏览器中访问（或使用 curl）以确认服务可用：

- `https://<subdomain>.pmate.chat`

## 常见后续操作

- `pmate list`：确认 CLI 能识别应用条目。
- `pmate env <app-name> --list`：查看远程环境变量。
