# How to set up environment (macOS & Ubuntu)?

Install the local toolchain used across this repo before running any apps or scripts.

## Table of Contents

- [Background](#background)
- [Required tools](#required-tools)
- [macOS (Homebrew)](#macos-homebrew)
- [Ubuntu](#ubuntu)
- [Local env files](#local-env-files)
- [Monorepo structure (how to create)](#monorepo-structure-how-to-create)
- [Create a Vite app](#create-a-vite-app)
- [Create a Node app (with Bun)](#create-a-node-app-with-bun)
- [Next step](#next-step)

## Background

Multi-app monorepos tend to break onboarding when each service expects a slightly different runtime. Standardizing on a single Node + pnpm setup keeps installs fast and avoids “works on my machine” mismatches.

This repo uses Node.js and pnpm for all packages, with a few optional tools for service runners and scripts. The steps below bring your machine to the same baseline that CI and teammate environments assume.

## Required tools

- Node.js 24 (via nvm; see `package.json` engines)
- pnpm 10.6.5 (see `package.json` packageManager)
- Git
- Visual Studio Code
- Codex VS Code extension

### Tool background + official links

- Node.js: JavaScript runtime for backend services and tooling used in the monorepo.  
  Official: `https://nodejs.org/`
- nvm: Version manager to keep Node versions consistent across projects.  
  Official: `https://github.com/nvm-sh/nvm`
- pnpm: Workspace-aware package manager for installs and linking across packages.  
  Official: `https://pnpm.io/`
- Corepack: Bundled Node tool to pin and activate package managers like pnpm.  
  Official: `https://nodejs.org/api/corepack.html`
- Git: Source control for tracking changes and collaborating.  
  Official: `https://git-scm.com/`
- Visual Studio Code: Primary editor used in the team workflow.  
  Official: `https://code.visualstudio.com/`
- Codex VS Code extension: AI coding assistant integrated in the editor sidebar.  
  Official: `https://developers.openai.com/codex/ide`

## macOS (Homebrew)

Install Git:

```bash
brew update
brew install git
```

Install editors/tools:

```bash
brew install --cask visual-studio-code
```

Install the Codex VS Code extension from the Marketplace (OpenAI Codex):  
`https://developers.openai.com/codex/ide`

Install nvm, then install Node 24:

```bash
brew install nvm
mkdir -p ~/.nvm
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
echo '[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && . "/opt/homebrew/opt/nvm/nvm.sh"' >> ~/.zshrc
source ~/.zshrc
nvm install 24
nvm use 24
```

Enable Corepack and activate the repo pnpm version:

```bash
corepack enable
corepack prepare pnpm@10.6.5 --activate
```

Verify versions:

```bash
node -v
pnpm -v
```

## Ubuntu

Install base packages:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git
```

Install editors/tools:

```bash
sudo snap install --classic code
```

Install the Codex VS Code extension from the Marketplace (OpenAI Codex):  
`https://developers.openai.com/codex/ide`

Install nvm, then install Node 24:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm install 24
nvm use 24
```

Enable Corepack and pnpm:

```bash
corepack enable
corepack prepare pnpm@10.6.5 --activate
```

Verify versions:

```bash
node -v
pnpm -v
```

## Local env files

Most Node services load `.env.local` first, then `.env` (see `apps/*/src/env.ts`). Keep secrets in `.env.local` and avoid committing them. Vite apps read `VITE_`-prefixed variables for client-side config.

## Monorepo structure (how to create)

Create a monorepo by keeping all apps and shared packages in predictable folders, then use `pnpm-workspace.yaml` at the repo root to wire them together. A common structure looks like:

```
pmate/
  apps/
    <vite-app>/
      src/
      package.json
    <node-app>/
      src/
      package.json
  packages/
    <shared-lib>/
      src/
      package.json
  docs/
  scripts/
  pnpm-workspace.yaml
  package.json
```

Notes:

- UI and Node apps live under `apps/*` (Vite apps are also under `apps/*`).
- Shared libraries live under `packages/*`.
- `pnpm-workspace.yaml` declares the workspace packages so `pnpm` can link them.

## Create a Vite app

Vite is chosen for its fast dev server and optimized build pipeline, which keeps frontend iteration quick even as projects grow. It standardizes the setup for React + TypeScript apps so teams don’t need to hand-roll bundling configs.

Official: `https://vitejs.dev/`

Use Vite to scaffold a new frontend under `apps/`:

```bash
pnpm create vite apps/<app-name> -- --template react-ts
cd apps/<app-name>
pnpm install
```

Optional: add a workspace script in the app `package.json` and run it from repo root with `pnpm --filter <app-name> dev`.

## Create a Node app (with Bun)

Bun provides a fast runtime and tooling layer (runner, test, and TS support) that simplifies local Node service development. Using Bun for execution keeps server startup and reloads fast, while installs still rely on pnpm for workspace consistency.

Official: `https://bun.sh/`

Use Bun to scaffold a new Node app under `apps/`:

```bash
bun create apps/<app-name>
cd apps/<app-name>
```

Notes:

- Keep server entrypoints in `src/` (e.g. `src/index.ts`).
- Use pnpm at the repo root for installs to keep workspace linking and a single lockfile:

```bash
cd <repo-root>
pnpm install
```

- Prefer Bun to run the Node app locally (e.g. `bun run dev`).

## Next step

From the repo root:

```bash
pnpm install
```
