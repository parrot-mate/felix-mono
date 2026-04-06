# Create App: Rust

通过 pmate CLI 初始化服务器基础设施并部署 Rust 服务。

## 目录

- [背景](#背景)
- [前置条件](#前置条件)
- [在 .pmate.yaml 中添加应用](#在-pmateyaml-中添加应用)
- [第一步：初始化基础设施](#第一步：初始化基础设施)
- [第二步：部署应用](#第二步：部署应用)
- [常见后续操作](#常见后续操作)

## 背景

Rust 服务通常以二进制形式发布，但上线依然需要 nginx、DNS 与稳定的重启流程。手动维护容易在不同环境产生差异。

Pmate CLI 使用 `.pmate.yaml` 把服务器与部署流程串联起来，保证一致性。本指南聚焦 Rust 类型，让构建与重启更可控。

## 前置条件

安装 CLI：

```bash
npm i -g @pmate/cli
```

在 `~/.pmate/config` 中配置所需凭证：

```bash
mkdir -p ~/.pmate
cat <<'CONF' > ~/.pmate/config
ALIYUN_AK=your_access_key_id
ALIYUN_SK=your_access_key_secret
OSS_REGION=cn-hangzhou
CONF
```

确保 `.pmate.yaml` 中已配置 Rust 应用，包含 `type`、`subdomain`、`server`、`port`、`repository`、`script`。

`script` 需要支持 `restart` 参数，并在服务器上完成构建与重启。

若仓库为私有，需要在 `~/.pmate/config` 中配置 GitHub token 以便服务器克隆。

## 在 .pmate.yaml 中添加应用

在仓库根目录的 `.pmate.yaml` 中新增 `rust` 类型配置：

```yaml
apps:
  - app: <app-name>
    type: rust
    subdomain: <subdomain>
    server: <server-ip-or-host>
    port: 9107
    repository: owner/repo
    script: ./scripts/restart.sh
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

- SSH 登录 `pmate@<server>`，拉取仓库并执行 `script restart`。

## 常见后续操作

- `pmate list`：确认 CLI 能识别应用条目。
- `pmate env <app-name> --list`：若服务依赖远程环境变量，可用于查看。
