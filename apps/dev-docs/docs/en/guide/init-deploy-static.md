# Create App: Static

Provision OSS/CDN infra and deploy static assets with the pmate CLI.

## Table of Contents

- [Background](#background)
- [Prerequisites](#prerequisites)
- [Add the app to .pmate.yaml](#add-the-app-to-pmateyaml)
- [Step 1: Initialize infrastructure](#step-1-initialize-infrastructure)
- [Step 2: Deploy the app](#step-2-deploy-the-app)
- [Common follow-ups](#common-follow-ups)

## Background

Static sites still need buckets, CDN configuration, and HTTPS before they can go live. When each of those steps is done manually, it becomes easy to forget a rewrite rule or miss a DNS record.

Pmate CLI centralizes the setup in `.pmate.yaml` and keeps init and deploy aligned. This guide focuses on static apps so you can push content fast and keep infrastructure consistent.

## Prerequisites

1. Install the CLI:

```bash
npm i -g @pmate/cli
```

2. Store required credentials in `~/.pmate/config`:

```bash
mkdir -p ~/.pmate
cat <<'CONF' > ~/.pmate/config
ALIYUN_AK=your_access_key_id
ALIYUN_SK=your_access_key_secret
OSS_REGION=cn-hangzhou
CONF
```

3. Ensure `.pmate.yaml` includes a static app entry with `type`, `bucket`, and optional `subdomain`. The root config must set `domain`.

4. Follow the monorepo app structure: [/guide/mono-app-structure](/guide/mono-app-structure).

5. Put your static files under `apps/<app>/src`.

## Add the app to .pmate.yaml

In the repo root, add a `static` entry under `apps` and set `domain`:

```yaml
domain: pmate.chat
apps:
  - app: <app-name>
    type: static
    bucket: <oss-bucket>
    subdomain: <subdomain>
```

## Step 1: Initialize infrastructure

```bash
pmate init <app-name>
```

What it does:

- Creates or ensures the OSS bucket and CDN domain.
- Adds CNAME records, enables HTTPS, and sets SPA rewrite rules.

## Step 2: Deploy the app

```bash
pmate deploy <app-name>
```

What it does:

- Uploads `apps/<app>/src` to OSS.

## Common follow-ups

- `pmate list` to confirm the CLI sees the app entry.
- `pmate oss` to verify the bucket exists.
