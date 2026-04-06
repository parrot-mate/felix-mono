# Create App: Vite

Provision OSS/CDN infra and deploy a Vite build with the pmate CLI.

## Table of Contents

- [Background](#background)
- [Prerequisites](#prerequisites)
- [Add the app to .pmate.yaml](#add-the-app-to-pmateyaml)
- [Step 1: Initialize infrastructure](#step-1-initialize-infrastructure)
- [Step 2: Deploy the app](#step-2-deploy-the-app)
- [Step 3: Verify the deployment](#step-3-verify-the-deployment)
- [Common follow-ups](#common-follow-ups)

## Background

Vite apps are easy to build locally, but production still requires OSS buckets, CDN domains, HTTPS, and rewrite rules. If each team member wires these by hand, the deployment path gets fragile.

Pmate CLI standardizes the infra setup by reading `.pmate.yaml` and running a repeatable init/deploy flow. This guide covers the Vite-specific steps so you can ship quickly and keep the CDN config consistent.

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

3. Add a `.pmate.yaml` file at the repo root and include a Vite app entry.
   See the specification: [https://dev-docs.pmate.chat/cn/pmate-cli/pmate-yaml](https://dev-docs.pmate.chat/cn/pmate-cli/pmate-yaml).

4. Follow the monorepo app structure: [/guide/mono-app-structure](/guide/mono-app-structure).

5. Make sure `apps/<app>/package.json` has a valid `name` for `pnpm --filter`.

## Add the app to .pmate.yaml

In the repo root, add a `vite` entry under `apps` and set `domain`:

```yaml
domain: pmate.chat
apps:
  - app: <app-name>
    type: vite
    bucket: <oss-bucket>
    subdomain: <subdomain>
    routeType: spa
```

## Step 1: Initialize infrastructure

```bash
pmate init <app-name>
```

What it does:

- Creates or ensures the OSS bucket and CDN domain.
- Adds CNAME records, enables HTTPS, and sets SPA or SSG rewrite rules.

## Step 2: Deploy the app

```bash
pmate deploy <app-name>
```

What it does:

- Runs `pnpm --filter <package> build`.
- Uploads `apps/<app>/dist` to OSS.

## Step 3: Verify the deployment

Open the CDN domain in a browser to confirm the build is live:

- `https://<subdomain>.<domain>` (or `https://<domain>` if you skipped `subdomain`)

## Common follow-ups

- `pmate list` to confirm the CLI sees the app entry.
- `pmate env <app-name> --list` if you also manage a Node backend.
