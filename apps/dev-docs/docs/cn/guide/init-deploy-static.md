# Create App: Static

通过 pmate CLI 初始化 OSS/CDN 并部署静态资源。

## 目录

- [背景](#背景)
- [前置条件](#前置条件)
- [在 .pmate.yaml 中添加应用](#在-pmateyaml-中添加应用)
- [第一步：初始化基础设施](#第一步：初始化基础设施)
- [第二步：部署应用](#第二步：部署应用)
- [常见后续操作](#常见后续操作)

## 背景

静态站点上线同样需要 OSS 存储桶、CDN、HTTPS 与重写规则。若手动配置，往往会遗漏 DNS 或规则设置。

Pmate CLI 通过 `.pmate.yaml` 统一基础设施流程，使 init 与 deploy 可重复执行。本指南专注静态应用，帮助你快速发布。

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

3. 确保 `.pmate.yaml` 中已配置静态应用，包含 `type`、`bucket`，可选 `subdomain`。根配置需提供 `domain`。

4. 请遵循 monorepo 应用结构：[/guide/mono-app-structure](/guide/mono-app-structure)。

5. 将静态资源放在 `apps/<app>/src`。

## 在 .pmate.yaml 中添加应用

在仓库根目录的 `.pmate.yaml` 中新增 `static` 类型配置，并设置 `domain`：

```yaml
domain: pmate.chat
apps:
  - app: <app-name>
    type: static
    bucket: <oss-bucket>
    subdomain: <subdomain>
```

## 第一步：初始化基础设施

```bash
pmate init <app-name>
```

行为说明：

- 创建或确保 OSS bucket 与 CDN 域名。
- 配置 CNAME、开启 HTTPS，并设置 SPA 重写规则。

## 第二步：部署应用

```bash
pmate deploy <app-name>
```

行为说明：

- 上传 `apps/<app>/src` 到 OSS。

## 常见后续操作

- `pmate list`：确认 CLI 能识别应用条目。
- `pmate oss`：检查 bucket 是否创建成功。
