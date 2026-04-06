# How to set up environment (macOS & Ubuntu)?

在本仓库运行应用与脚本前，先安装一致的本地开发环境。

## 目录

- [背景](#背景)
- [必备工具](#必备工具)
- [macOS（Homebrew）](#macos（homebrew）)
- [Ubuntu](#ubuntu)
- [本地环境变量文件](#本地环境变量文件)
- [Monorepo 结构（如何创建）](#monorepo-结构（如何创建）)
- [创建 Vite 应用](#创建-vite-应用)
- [创建 Node 应用（使用 Bun）](#创建-node-应用（使用-bun）)
- [下一步](#下一步)

## 背景

多应用仓库最容易在“每个服务一套运行时”时出现上手门槛与环境漂移。统一 Node 与 pnpm 版本，可以减少安装问题与依赖不一致。

本仓库所有包都基于 Node.js 与 pnpm 构建，并在少数脚本中依赖额外工具。以下步骤提供与 CI 和团队一致的最小环境基线。

## 必备工具

- Node.js 24（通过 nvm 安装，见根目录 `package.json` 的 engines）
- pnpm 10.6.5（见根目录 `package.json` 的 packageManager）
- Git
- Visual Studio Code
- Codex VS Code 扩展

### 工具背景与官方链接

- Node.js：后端服务与工程化脚本所依赖的 JavaScript 运行时。  
  官方：`https://nodejs.org/`
- nvm：用于统一管理 Node 版本，避免不同项目环境不一致。  
  官方：`https://github.com/nvm-sh/nvm`
- pnpm：支持 workspace 的包管理器，负责依赖安装与包之间链接。  
  官方：`https://pnpm.io/`
- Corepack：Node 自带的包管理器管理工具，用于固定并启用 pnpm。  
  官方：`https://nodejs.org/api/corepack.html`
- Git：版本控制与协作工具。  
  官方：`https://git-scm.com/`
- Visual Studio Code：团队常用的代码编辑器。  
  官方：`https://code.visualstudio.com/`
- Codex VS Code 扩展：集成在编辑器侧边栏的 AI 编码助手。  
  官方：`https://developers.openai.com/codex/ide`

## macOS（Homebrew）

安装 Git：

```bash
brew update
brew install git
```

安装编辑器与工具：

```bash
brew install --cask visual-studio-code
```

在 VS Code 中安装 Codex 扩展（OpenAI Codex）：  
`https://developers.openai.com/codex/ide`

安装 nvm，然后安装 Node 24：

```bash
brew install nvm
mkdir -p ~/.nvm
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
echo '[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && . "/opt/homebrew/opt/nvm/nvm.sh"' >> ~/.zshrc
source ~/.zshrc
nvm install 24
nvm use 24
```

启用 Corepack 并固定 pnpm 版本：

```bash
corepack enable
corepack prepare pnpm@10.6.5 --activate
```

验证版本：

```bash
node -v
pnpm -v
```

## Ubuntu

安装基础包：

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git
```

安装编辑器与工具：

```bash
sudo snap install --classic code
```

在 VS Code 中安装 Codex 扩展（OpenAI Codex）：  
`https://developers.openai.com/codex/ide`

安装 nvm，然后安装 Node 24：

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm install 24
nvm use 24
```

启用 Corepack 与 pnpm：

```bash
corepack enable
corepack prepare pnpm@10.6.5 --activate
```

验证版本：

```bash
node -v
pnpm -v
```

## 本地环境变量文件

多数 Node 服务会先读取 `.env.local` 再读取 `.env`（见 `apps/*/src/env.ts`）。请把密钥放在 `.env.local`，避免提交到仓库。Vite 应用需要以 `VITE_` 前缀声明前端环境变量。

## Monorepo 结构（如何创建）

创建 monorepo 的关键是把应用与公共包放在固定目录，并在仓库根目录用 `pnpm-workspace.yaml` 统一管理。常见结构如下：

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

说明：

- UI 与 Node 应用都放在 `apps/*`（Vite 应用也放在 `apps/*`）。
- 共享库放在 `packages/*`。
- `pnpm-workspace.yaml` 声明 workspace 包，供 `pnpm` 统一链接与安装。

## 创建 Vite 应用

Vite 作为前端工具链的重点在于启动速度与构建效率，适合在团队中快速统一 React + TypeScript 的开发体验，避免重复配置打包与开发服务器。

官方：`https://vitejs.dev/`

用 Vite 在 `apps/` 下初始化前端应用：

```bash
pnpm create vite apps/<app-name> -- --template react-ts
cd apps/<app-name>
pnpm install
```

可选：在应用 `package.json` 里添加脚本，然后在仓库根目录用 `pnpm --filter <app-name> dev` 运行。

## 创建 Node 应用（使用 Bun）

Bun 提供了更快的运行时与工具链（执行、测试、TypeScript 支持），能让本地服务启动与热更新更轻量。使用 Bun 负责运行，同时用 pnpm 负责 workspace 依赖，保证仓库一致性。

官方：`https://bun.sh/`

用 Bun 在 `apps/` 下初始化 Node 应用：

```bash
bun create apps/<app-name>
cd apps/<app-name>
```

说明：

- 服务入口建议放在 `src/`（例如 `src/index.ts`）。
- 依赖安装请在仓库根目录使用 pnpm，保持 workspace 链接与单一锁文件：

```bash
cd <repo-root>
pnpm install
```

- 本地运行优先使用 Bun（例如 `bun run dev`）。

## 下一步

在仓库根目录执行：

```bash
pnpm install
```
