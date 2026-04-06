# Monorepo 应用结构与技术栈

本页说明使用 pmate CLI 部署 Node、Vite、static 应用时，仓库需要遵循的 monorepo 目录结构与推荐技术栈。

## 目录

- [背景](#背景)
- [必要结构](#必要结构)
- [Monorepo 搭建步骤](#monorepo-搭建步骤)
- [应用说明](#应用说明)
- [使用的工具](#使用的工具)
- [推荐技术栈](#推荐技术栈)

## 背景

随着仓库规模扩大，应用代码、基础设施脚本和共享包会散落在不同目录里，CLI 很难稳定定位构建产物、PM2 配置或静态资源。

Pmate 约定所有可部署应用都放在 `apps/<app>` 下，从而让 init/deploy 流程能在无需额外参数的情况下，准确找到 `package.json`、静态资源或 PM2 配置。

## 必要结构

- 可部署应用放在 `apps/<app>`。
- 共享包放在 `packages/<package>`。
- 仓库根目录包含 `.pmate.yaml` 与工作区配置（`package.json`、`pnpm-workspace.yaml`）。

示例结构：

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

## Monorepo 搭建步骤

1. 在仓库根目录创建 `package.json`、`pnpm-workspace.yaml` 与 `.pmate.yaml`。
2. 将可部署应用放在 `apps/<app>`，共享包放在 `packages/<package>`。
3. 为每个应用提供独立的 `package.json`，并约定构建输出目录（Vite 为 `dist`）。
4. 在仓库根目录执行 `pnpm install` 以连接工作区包。
5. 使用 `pnpm --filter <app>` 运行指定应用的构建、开发或部署。

## 应用说明

- Vite 应用：构建产物在 `apps/<app>/dist`，请确保 `apps/<app>/package.json` 的 `name` 可用于 `pnpm --filter`。
- Static 应用：静态资源读取自 `apps/<app>/src`。
- Node 应用：PM2 配置放在 `apps/<app>/ecosystem.config.cjs`（或 `.js`）。

## 使用的工具

- `pnpm`：支持工作区的包管理器，用于安装依赖与筛选构建目标。
- `pnpm-workspace.yaml`：声明工作区范围，启用 `pnpm --filter` 跨应用与共享包。
- `.pmate.yaml`：定义 pmate CLI 可部署的应用与目标。

## 推荐技术栈

前端：

- React：组件化 UI 框架。
- Vite：快速开发服务器与构建工具。
- Tailwind CSS：实用优先的样式框架。
- Jotai：原子化状态管理方案。

后端：

- Bun：兼容 Node 的高性能运行时。
- ElysiaJS：与 Bun 常搭配的类型安全 HTTP 框架。
