# Create App: Vite

通过 pmate CLI 初始化 OSS/CDN 并部署 Vite 构建产物。

## 目录

- [背景](#背景)
- [前置条件](#前置条件)
- [在 .pmate.yaml 中添加应用](#在-pmateyaml-中添加应用)
- [第一步：初始化基础设施](#第一步：初始化基础设施)
- [第二步：部署应用](#第二步：部署应用)
- [第三步：验证部署结果](#第三步：验证部署结果)
- [常见后续操作](#常见后续操作)

## 背景

Vite 应用构建很快，但上线依然需要 OSS 存储桶、CDN 域名、HTTPS 与重写规则。手动配置容易遗漏细节，影响上线节奏。

Pmate CLI 通过 `.pmate.yaml` 把基础设施步骤统一起来，让 init 与 deploy 可重复执行。本指南聚焦 Vite 类型，帮助你快速交付。

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

3. 在仓库根目录创建 `.pmate.yaml` 并配置 Vite 应用。
   规范说明见：[https://dev-docs.pmate.chat/cn/pmate-cli/pmate-yaml](https://dev-docs.pmate.chat/cn/pmate-cli/pmate-yaml)。

4. 请遵循 monorepo 应用结构：[/guide/mono-app-structure](/guide/mono-app-structure)。

5. 确保 `apps/<app>/package.json` 的 `name` 可用于 `pnpm --filter`。

## 在 .pmate.yaml 中添加应用

在仓库根目录的 `.pmate.yaml` 中新增 `vite` 类型配置，并设置 `domain`：

```yaml
domain: pmate.chat
apps:
  - app: <app-name>
    type: vite
    bucket: <oss-bucket>
    subdomain: <subdomain>
    routeType: spa
```

## 第一步：初始化基础设施

```bash
pmate init <app-name>
```

行为说明：

- 创建或确保 OSS bucket 与 CDN 域名。
- 配置 CNAME、开启 HTTPS，并设置 SPA 或 SSG 重写规则。

## 第二步：部署应用

```bash
pmate deploy <app-name>
```

行为说明：

- 执行 `pnpm --filter <package> build`。
- 上传 `apps/<app>/dist` 到 OSS。

## 第三步：验证部署结果

在浏览器中访问 CDN 域名确认已生效：

- `https://<subdomain>.<domain>`（未配置 `subdomain` 时访问 `https://<domain>`）

## 常见后续操作

- `pmate list`：确认 CLI 能识别应用条目。
- `pmate env <app-name> --list`：若同时管理 Node 后端，可查看环境变量。
