# 如何使用 skills？

## 背景

在日常开发中，部署、Linear 工单处理、PR 创建、问题处理等流程会反复出现。如果每次都手动解释上下文和命令步骤，容易遗漏关键参数，也会降低协作效率。

skill 的目标是把这些高频流程沉淀为可复用的执行手册（`SKILL.md`），把触发条件、输入要求和步骤顺序标准化，从而提升一致性并减少操作失误。

## 什么是 skill？

在 `pmate-skills` 中，每个 skill 是一个目录，核心是 `SKILL.md`，用于定义：

- 什么时候使用这个 skill
- 需要哪些上下文
- 应该按什么步骤执行
- 常见报错与排查方式

部分 skill 还会包含 `agents/<provider>.yaml`，用于 provider 相关行为配置。

## skill 在哪里

当前工作区本地 skills 目录：

`~/dev/pmate/pmate-skills`

GitHub 仓库：

[parrot-mate/pmate-skills](https://github.com/parrot-mate/pmate-skills)

每个子目录对应一个 skill，例如：

- `pmate-deploy`
- `pmate-linear`
- `pmate-pr`
- `process-my-issues`

## 如何安装 skills

### 通过 OpenAI（Codex）安装

1. 将 skill 目录安装到 Codex 的 skills 目录（通常是 `$CODEX_HOME/skills/<skill-name>`）。
2. 确认 skill 内包含有效的 `SKILL.md`，并带有 `name`、`description`。
3. 如果 skill 依赖脚本或资源文件，保持相对路径不变。
4. 重启 Codex 会话后，通过意图描述或 skill 名称触发。

### 通过 Claude 安装

1. 将 skill 目录安装到 Claude 的 skills 位置（按你的配置选择项目级或用户级）。
2. 确认 `SKILL.md` 存在，且引用文件完整。
3. 确保 `SKILL.md` 中的 runbook 命令可在本地环境执行。
4. 重启 Claude 会话后，用明确任务描述触发 skill。

## 实际如何使用 skill

1. 用自然语言描述目标。
2. 必要时明确提到 skill 或命令（例如 `pmate deploy`、`pmate linear`、`pmate pr`）。
3. 在同一条请求里补齐关键上下文：
- 目标仓库或路径
- app 名称或 issue 标识
- 账号/团队约束（如需要）
4. 按对应 `SKILL.md` 的 runbook 顺序执行。

## 如何新增一个 skill

1. 在 `pmate-skills` 下创建新目录。
2. 添加 `SKILL.md`，并写入 frontmatter：

```yaml
---
name: example-skill
description: "Use when ..."
---
```

3. 明确触发规则、必需上下文和步骤顺序。
4. 增加排障与 fallback 说明。
5. 仅在需要 provider 特定提示时再添加 `agents/<provider>.yaml`。

## 常见问题

- 没触发 skill：描述命令意图更具体，或直接写 skill 名称。
- 上下文不足：补充 repo 路径、app 名称、issue id、account title。
- 流程不明确：以 skill 文档中的命令顺序为准。
