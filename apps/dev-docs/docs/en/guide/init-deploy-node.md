# Create App: Node

Provision server-side infra and ship a Node service with the pmate CLI.

## Table of Contents

- [Background](#background)
- [Prerequisites](#prerequisites)
- [Add the app to .pmate.yaml](#add-the-app-to-pmateyaml)
- [Step 1: Initialize infrastructure](#step-1-initialize-infrastructure)
- [Step 2: Deploy the app](#step-2-deploy-the-app)
- [Step 3: Verify the deployment](#step-3-verify-the-deployment)
- [Common follow-ups](#common-follow-ups)

## Background

Node services usually need a server, nginx routing, and a repeatable way to restart the process. When those steps are done by hand, small config drifts or missing files show up late in deployment.

Pmate CLI keeps the workflow consistent by reading `.pmate.yaml` and wiring the server + DNS pieces in one command. This guide focuses on the Node-specific pieces so you can go from config to a live service quickly.

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

3. Add a `.pmate.yaml` file at the repo root and include a Node app entry.
   See the specification: [https://dev-docs.pmate.chat/cn/pmate-cli/pmate-yaml](https://dev-docs.pmate.chat/cn/pmate-cli/pmate-yaml).

4. Follow the monorepo app structure: [/guide/mono-app-structure](/guide/mono-app-structure).

5. Add a PM2 ecosystem file for the app:

- `apps/<app>/ecosystem.config.cjs`
- `apps/<app>/ecosystem.config.js`

6. If the repo is private, set a GitHub token in `~/.pmate/config` so the server can clone.

## Add the app to .pmate.yaml

In the repo root, add a `node` entry under `apps`:

```yaml
apps:
  - app: <app-name>
    type: node
    subdomain: <subdomain>
    server: <server-ip-or-host>
    port: 9107
    repository: owner/repo
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

- SSH to `pmate@<server>`, clone or pull the repo, and install dependencies.
- Locates the PM2 ecosystem file and starts or reloads the app with `PORT=<port>`.

## Step 3: Verify the deployment

Open the service URL in a browser (or curl it) to confirm it responds:

- `https://<subdomain>.pmate.chat`

## Common follow-ups

- `pmate list` to confirm the CLI sees the app entry.
- `pmate env <app-name> --list` to inspect remote env vars.
