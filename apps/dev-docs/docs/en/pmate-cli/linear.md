# How to Use Linear?

Use `pmate linear` to access Linear from terminal with account selection, team resolution, issue read/write, and PR-to-issue automation.

## Table of Contents

- [Background](#background)
- [Prerequisites](#prerequisites)
- [Configuration](#configuration)
- [How account and team are selected](#how-account-and-team-are-selected)
- [Quick verification](#quick-verification)
- [Common workflows](#common-workflows)
- [Troubleshooting](#troubleshooting)

## Background

Issue updates usually start from local work: code diff, terminal logs, and current branch context. Switching between CLI and Linear UI for each change adds friction and causes inconsistent issue descriptions.

`pmate linear` keeps that workflow in one place. You can create, read, update, and comment on issues directly from shell, then keep context from local repo and branch intact.

For teams with multiple Linear workspaces, the hard part is always access control and default target selection. `pmate linear` supports multi-account config, per-repo overrides, explicit `--account`, and default selection cache per working directory.

This guide focuses on reliable access first, then day-to-day commands. If access is configured correctly, every Linear command in this page works the same way in scripts and manual runs.

## Prerequisites

- `pmate` installed and runnable.
- A valid Linear API key.
- For `pmate linear pr`: authenticated `gh` CLI and git repository context.
- For AI-assisted flows (`create --repl`, screenshot mode, and `linear pr` summary generation): `openAI.apiKey` in `~/.pmate/config.yaml`.

## Configuration

### Global user config (`~/.pmate/config.yaml`)

```yaml
linear:
  teamKey: ENG
  accounts:
    - title: work
      apiKey: your_linear_api_key
      # optional account-level defaults
      teamKey: ENG
    - title: personal
      apiKey: your_other_linear_api_key
```

Rules:

- `linear.accounts` is required unless repo config provides an inline account.
- `accounts[].title` must be unique.
- `accounts[].apiKey` is required.

### Optional repo override (`.pmate.yaml`)

```yaml
linear:
  teamKey: ENG
  account:
    title: repo-work
    apiKey: your_repo_linear_api_key
```

Use this when a repository should always use a dedicated Linear account.

## How account and team are selected

### Account resolution order

1. `--account <title>` if provided.
2. Repo-level `.pmate.yaml` `linear.account` when no explicit account is provided.
3. `~/.pmate/config.yaml` `linear.accounts`.
4. If multiple accounts remain, prompt once and cache selection in `~/.pmate/linear-selection.json` keyed by cwd.

### Team resolution order

1. Explicit `--team-id`.
2. Account/repo/global configured `teamId`.
3. Explicit/configured `teamKey`.
4. If exactly one team is visible in account, auto-select it.
5. Otherwise command fails and asks you to provide team id/key.

## Quick verification

```bash
pmate linear whoami --account work
pmate linear teams --account work
pmate linear cycle --account work --team-key ENG
```

## Common workflows

### Create issues

```bash
# direct create
pmate linear create --account work --team-key ENG --title "Fix login timeout"
pmate linear create --account work --team-key ENG --title "Retry webhook" --desc "Retry on 5xx" --priority 2

# interactive AI create
pmate linear create --account work --repl

# from current GitHub PR
pmate linear pr --account work
```

### Read issues

```bash
pmate linear view ENG-123 --account work
pmate linear sub-issues ENG-123 --account work
pmate linear comments ENG-123 --account work
```

### Update and comment

```bash
pmate linear update ENG-123 --account work --title "Updated title"
pmate linear update ENG-123 --account work --desc $'line1\nline2'
pmate linear update ENG-123 --account work --priority 1
pmate linear comment ENG-123 --account work --body "Investigated and reproduced"
```

### List and filter

```bash
# personal queue with filter
pmate linear user-issues "Ryan" --account work --status "In Progress"

# team issue listing with filters
pmate linear issues --account work --team-key ENG --cycle 82 --status "Todo" --limit 100
pmate linear issues --account work --query "login timeout" --user "Ryan"
```

## Troubleshooting

- `Missing Linear config. Add linear.accounts ...`: add `linear.accounts` in `~/.pmate/config.yaml`, or define repo `linear.account`.
- `Duplicate Linear account titles ...`: make every account `title` unique.
- `No Linear team found ...`: verify `--team-key`/`teamId` and account access permissions.
- `Multiple Linear teams found ...`: pass `--team-id`/`--team-key` or set a default team.

Legacy flags are still accepted:

```bash
pmate linear --repl
pmate linear --pr
pmate linear --screen-shot
```
