# Create App: Rust

Provision server-side infra and deploy a Rust service with the pmate CLI.

## Table of Contents

- [Background](#background)
- [Prerequisites](#prerequisites)
- [Add the app to .pmate.yaml](#add-the-app-to-pmateyaml)
- [Step 1: Initialize infrastructure](#step-1-initialize-infrastructure)
- [Step 2: Deploy the app](#step-2-deploy-the-app)
- [Common follow-ups](#common-follow-ups)

## Background

Rust services often ship as binaries, but the infra work is similar to other server apps: nginx, DNS, and a stable restart workflow. When those are maintained manually, deployments drift across environments.

Pmate CLI uses `.pmate.yaml` to keep the server setup and deploy steps consistent. This guide focuses on the Rust-specific workflow so you can keep builds and restarts predictable.

## Prerequisites

Install the CLI:

```bash
npm i -g @pmate/cli
```

Store required credentials in `~/.pmate/config`:

```bash
mkdir -p ~/.pmate
cat <<'CONF' > ~/.pmate/config
ALIYUN_AK=your_access_key_id
ALIYUN_SK=your_access_key_secret
OSS_REGION=cn-hangzhou
CONF
```

Ensure `.pmate.yaml` includes a Rust app entry with `type`, `subdomain`, `server`, `port`, `repository`, and `script`.

The `script` must accept a `restart` argument and handle build/restart on the server.

If the repo is private, set a GitHub token in `~/.pmate/config` so the server can clone.

## Add the app to .pmate.yaml

In the repo root, add a `rust` entry under `apps`:

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

## Step 1: Initialize infrastructure

```bash
pmate init <app-name>
```

What it does:

- Uploads nginx config to the server based on `serviceType` (`rest` or `ws`).
- Reloads nginx and adds an A record for `<subdomain>.pmate.chat`.

## Step 2: Deploy the app

```bash
pmate deploy <app-name>
```

What it does:

- SSH to `pmate@<server>`, clone or pull the repo, and run the `script` with `restart`.

## Common follow-ups

- `pmate list` to confirm the CLI sees the app entry.
- `pmate env <app-name> --list` if the service uses remote env vars.
