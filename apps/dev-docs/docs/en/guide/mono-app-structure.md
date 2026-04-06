# Monorepo app & tech stack

This page describes the required monorepo layout and the suggested tech stack for Node, Vite, and static apps that are deployed with the pmate CLI.

## Table of Contents

- [Background](#background)
- [Required structure](#required-structure)
- [Step-by-step monorepo setup](#step-by-step-monorepo-setup)
- [App-specific notes](#app-specific-notes)
- [Tooling used](#tooling-used)
- [Suggested tech stack](#suggested-tech-stack)

## Background

As repos grow, app code, infra scripts, and shared packages often spread across many folders. That makes it hard for the CLI to reliably locate build outputs, PM2 configs, or static assets across different machines.

Pmate standardizes this by treating every deployable app as a folder under `apps/<app>`. With a consistent layout, init/deploy flows can find `package.json`, static assets, or PM2 config without extra flags.

## Required structure

- Deployable apps live in `apps/<app>`.
- Shared packages live in `packages/<package>`.
- The repo root contains `.pmate.yaml` and workspace configs (`package.json`, `pnpm-workspace.yaml`).

Example layout:

```text
.
├── .pmate.yaml
├── package.json
├── pnpm-workspace.yaml
├── apps
│   ├── web-vite
│   │   ├── package.json
│   │   └── src
│   ├── marketing-static
│   │   └── src
│   └── api-node
│       ├── package.json
│       └── ecosystem.config.cjs
└── packages
    └── ui-kit
```

## Step-by-step monorepo setup

1. Create the workspace root with `package.json`, `pnpm-workspace.yaml`, and `.pmate.yaml`.
2. Add deployable apps under `apps/<app>` and shared code under `packages/<package>`.
3. Ensure each app has its own `package.json` and build output directory (`dist` for Vite).
4. Run `pnpm install` at the repo root to link workspace packages.
5. Use `pnpm --filter <app>` to build, dev, or deploy a specific app.

## App-specific notes

- Vite apps: build outputs go to `apps/<app>/dist`. Ensure `apps/<app>/package.json` has a valid `name` for `pnpm --filter`.
- Static apps: static assets are read from `apps/<app>/src`.
- Node apps: keep the PM2 config at `apps/<app>/ecosystem.config.cjs` (or `.js`).

## Tooling used

- `pnpm`: Workspace-aware package manager used for installs and filtering builds.
- `pnpm-workspace.yaml`: Declares which folders are part of the workspace and enables `pnpm --filter` across apps and packages.
- `.pmate.yaml`: Defines deployable apps and targets for pmate CLI.

## Suggested tech stack

Frontend:

- React: UI library for building component-driven frontends.
- Vite: Fast dev server and bundler for modern web apps.
- Tailwind CSS: Utility-first styling framework for rapid UI iteration.
- Jotai: Atomic state management, used for shared app state.

Backend:

- Bun: Fast runtime for Node-compatible services and tooling.
- ElysiaJS: Type-safe HTTP framework commonly paired with Bun.
