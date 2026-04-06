# 如何使用 Linear？

使用 `pmate linear` 在终端中接入 Linear，完成账号选择、团队定位、工单读写和 PR 转工单。

## 目录

- [背景](#背景)
- [前置条件](#前置条件)
- [配置](#配置)
- [账号与团队如何决策](#账号与团队如何决策)
- [快速校验](#快速校验)
- [常见工作流](#常见工作流)
- [故障排查](#故障排查)

## 背景

工单更新往往从本地开发开始：代码 diff、终端日志、当前分支上下文都在 CLI 里。如果每次都切到 Linear 页面，流程会被打断，描述也容易不一致。

`pmate linear` 的价值是把这条链路放回一个入口。你可以在 shell 里直接创建、查看、更新、评论工单，同时保留本地仓库上下文。

当团队同时使用多个 Linear 工作区时，真正的难点是“用哪个账号、发到哪个 team”。`pmate linear` 提供了多账号配置、仓库级覆盖、显式 `--account`，以及按工作目录缓存选择结果。

本指南先解决“如何稳定接入”，再给出日常命令模板。只要接入配置正确，脚本和手工执行的行为会保持一致。

## 前置条件

- 本地可执行 `pmate`。
- 已有可用 Linear API Key。
- 若使用 `pmate linear pr`：需要 `gh` 已登录，且当前目录为 git 仓库。
- 若使用 AI 辅助流程（`create --repl`、截图模式、`linear pr` 生成描述）：需在 `~/.pmate/config.yaml` 配置 `openAI.apiKey`。

## 配置

### 全局用户配置（`~/.pmate/config.yaml`）

```yaml
linear:
  teamKey: ENG
  accounts:
    - title: work
      apiKey: your_linear_api_key
      # 可选：账号级默认 team
      teamKey: ENG
    - title: personal
      apiKey: your_other_linear_api_key
```

规则：

- 除非仓库配置内联账号，否则必须配置 `linear.accounts`。
- `accounts[].title` 必须唯一。
- `accounts[].apiKey` 必填。

### 可选仓库覆盖（`.pmate.yaml`）

```yaml
linear:
  teamKey: ENG
  account:
    title: repo-work
    apiKey: your_repo_linear_api_key
```

当某个仓库固定使用特定 Linear 账号时，建议使用该配置。

## 账号与团队如何决策

### 账号选择顺序

1. 命令行显式传入 `--account <title>`。
2. 未显式指定时，优先使用 `.pmate.yaml` 的 `linear.account`。
3. 否则读取 `~/.pmate/config.yaml` 的 `linear.accounts`。
4. 若仍有多个候选，CLI 会提示选择一次，并把结果按 cwd 缓存到 `~/.pmate/linear-selection.json`。

### 团队选择顺序

1. 显式 `--team-id`。
2. 账号/仓库/全局配置中的 `teamId`。
3. 显式或配置中的 `teamKey`。
4. 若当前账号仅可见一个 team，则自动选择。
5. 若存在多个可选 team 且未提供信息，命令会报错并提示补充 team id/key。

## 快速校验

```bash
pmate linear whoami --account work
pmate linear teams --account work
pmate linear cycle --account work --team-key ENG
```

## 常见工作流

### 创建工单

```bash
# 直接创建
pmate linear create --account work --team-key ENG --title "Fix login timeout"
pmate linear create --account work --team-key ENG --title "Retry webhook" --desc "Retry on 5xx" --priority 2

# AI 交互创建
pmate linear create --account work --repl

# 从当前 GitHub PR 生成工单
pmate linear pr --account work
```

### 查看工单

```bash
pmate linear view ENG-123 --account work
pmate linear sub-issues ENG-123 --account work
pmate linear comments ENG-123 --account work
```

### 更新与评论

```bash
pmate linear update ENG-123 --account work --title "Updated title"
pmate linear update ENG-123 --account work --desc $'line1\nline2'
pmate linear update ENG-123 --account work --priority 1
pmate linear comment ENG-123 --account work --body "Investigated and reproduced"
```

### 列表与筛选

```bash
# 按人查看待处理工单
pmate linear user-issues "Ryan" --account work --status "In Progress"

# 按团队/周期/状态筛选
pmate linear issues --account work --team-key ENG --cycle 82 --status "Todo" --limit 100
pmate linear issues --account work --query "login timeout" --user "Ryan"
```

## 故障排查

- `Missing Linear config...`：补充 `~/.pmate/config.yaml` 的 `linear.accounts`，或在 `.pmate.yaml` 设置 `linear.account`。
- `Duplicate Linear account titles...`：确保账号 `title` 唯一。
- `No Linear team found...`：核对 `--team-key`/`teamId` 与账号权限。
- `Multiple Linear teams found...`：显式传 `--team-id`/`--team-key`，或配置默认 team。

兼容旧参数：

```bash
pmate linear --repl
pmate linear --pr
pmate linear --screen-shot
```
