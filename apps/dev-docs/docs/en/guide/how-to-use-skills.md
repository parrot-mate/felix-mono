# How to use skills?

## Background

Skills reduce repeated setup work when you run common workflows such as deploy, Linear ticket handling, PR creation, and issue processing. Without skills, the same operational context and command shape must be re-explained every time.

A skill packages trigger conditions, required inputs, and execution steps into a reusable runbook (`SKILL.md`). This makes behavior more consistent across tasks and lowers the chance of missing required flags or config.

## What is a skill?

In `pmate-skills`, each skill is a folder with a `SKILL.md` that defines:

- when to use the skill,
- what context is required,
- the workflow steps to execute,
- troubleshooting notes.

Some skills also include `agents/<provider>.yaml` for provider-specific behavior.

## Where skills are located

Local skills for this workspace are in:

`~/dev/pmate/pmate-skills`

GitHub repository:

[parrot-mate/pmate-skills](https://github.com/parrot-mate/pmate-skills)

Each subfolder is one skill, for example:

- `pmate-deploy`
- `pmate-linear`
- `pmate-pr`
- `process-my-issues`

## How to install skills

### Install by OpenAI (Codex)

1. Install the skill folder into your Codex skills directory (normally `$CODEX_HOME/skills/<skill-name>`).
2. Ensure the skill includes a valid `SKILL.md` with `name` and `description`.
3. If the skill includes scripts/assets, keep relative paths unchanged.
4. Restart the Codex session and invoke the skill by intent or skill name.

### Install by Claude

1. Install the skill folder into your Claude skills location (project-level or user-level, based on your Claude setup).
2. Ensure `SKILL.md` exists and all referenced files are present.
3. Keep runbook commands in `SKILL.md` executable in your local environment.
4. Restart the Claude session and trigger the skill with explicit task wording.

## How to use a skill in practice

1. State your goal in plain language.
2. Mention the skill or command when useful (for example `pmate deploy`, `pmate linear`, `pmate pr`).
3. Provide necessary context in the same request:
- target repo or path
- app or issue identifier
- account/team constraints when relevant
4. The workflow follows the skill runbook from `SKILL.md`.

## How to add a new skill

1. Create a new folder under `pmate-skills`.
2. Add `SKILL.md` with frontmatter:

```yaml
---
name: example-skill
description: "Use when ..."
---
```

3. Write clear trigger rules, required context, and ordered steps.
4. Add troubleshooting and fallback behavior.
5. Add `agents/<provider>.yaml` only when provider-specific prompts are needed.

## Common issues

- Skill not selected: use clearer command intent or mention the skill name.
- Missing context: include repo path, app name, issue id, or account title.
- Ambiguous workflow: follow the exact command order documented in the skill.
