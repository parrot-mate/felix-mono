# Key knowledge in the proposal process

This guide explains the main knowledge contributors need when writing or reviewing a proposal in PMate. It is not only a file-structure checklist. The goal is to teach what each proposal document is for, what kind of thinking belongs there, and how the proposal should hand off into implementation docs after approval.

## Table of Contents

- [Why this guide exists](#why-this-guide-exists)
- [Proposal tree at a glance](#proposal-tree-at-a-glance)
- [Product](#product)
- [Dev doc](#dev-doc)
- [QA doc](#qa-doc)
- [Deploy doc](#deploy-doc)
- [What happens after approval](#what-happens-after-approval)

## Why this guide exists

The PMate proposal format uses four required files:

- `product.md`
- `develop.md`
- `qa.md`
- `deploy.md`

That structure is useful, but structure alone is not enough. Contributors also need to understand:

- why the content is split this way,
- how to decide which ideas belong in which file,
- what core concepts should be explained inside each file,
- how an approved proposal turns into implementation-facing documentation.

## Proposal tree at a glance

The proposal process can be understood as a two-level tree.

### Root level

- Product
- Dev doc
- QA doc
- Deploy doc

### Second level

Each root topic should contain a few stable knowledge areas rather than a random list of notes.

- Product:
  - problem and background
  - user value and goals
  - scope and non-goals
  - risks and open questions
- Dev doc:
  - technical design
  - repo impact
  - implementation phases
  - post-approval guide update
- QA doc:
  - unit test
  - integration test
  - e2e test
  - executable Markdown test cases
  - regression and edge cases
- Deploy doc:
  - environment assumptions
  - rollout steps
  - rollback plan
  - operational checks

## Product

`product.md` explains why the work matters.

### What belongs here

- the problem being solved
- who benefits from the change
- what success looks like
- what is in scope and out of scope
- product risks or unclear assumptions

### Common mistake

Do not turn `product.md` into a technical implementation plan. If the section starts talking mainly about packages, APIs, folder changes, or test runners, that content usually belongs in `develop.md` or `qa.md`.

### Helpful question

Ask: "If a product lead or reviewer reads only this file, will they understand the user problem and the intended outcome?"

## Dev doc

`develop.md` explains how the approved work should be implemented.

### What belongs here

- the technical design
- affected repos and key paths
- implementation phases and dependencies
- major tradeoffs
- architecture diagrams when needed

### Design vs task breakdown

This distinction matters:

- design explains how the system should work,
- task breakdown explains the order of execution.

Both may appear in `develop.md`, but they are not the same thing.

### Common mistake

Do not fill `develop.md` with product justification that belongs in `product.md`. Also do not reduce it to a vague todo list. Developers need enough detail to execute the work without guessing the architecture.

## QA doc

`qa.md` explains how the proposal will be verified. This is one of the most important educational sections because test terms are often confused.

### What is a unit test?

A unit test checks one small piece of behavior in isolation.

Examples:

- one function
- one class method
- one React component with mocked dependencies

Typical goal:

- verify logic quickly and precisely

Typical boundary:

- external systems such as databases, browsers, or network calls are usually mocked or stubbed

### What is an integration test?

An integration test checks whether multiple parts work together correctly.

Examples:

- API route plus database layer
- service logic plus queue or storage adapter
- UI flow with real internal modules but controlled external dependencies

Typical goal:

- catch wiring problems between modules that unit tests miss

Typical boundary:

- some real dependencies are used together, but the full system is not necessarily exercised end to end

### What is an e2e test?

An e2e test checks a complete user workflow from the outside, as close as possible to real usage.

Examples:

- user opens the app, logs in, submits a form, and sees the result
- operator runs a CLI command against a real or realistic environment and verifies the output

Typical goal:

- prove the feature works as a user or operator experiences it

Typical boundary:

- the test crosses multiple system layers such as UI, API, storage, and external integration

### How these test types work together

These test types are not interchangeable.

- Unit tests give fast feedback on local logic.
- Integration tests catch broken module boundaries.
- e2e tests validate the real workflow.

A strong proposal usually explains which of these layers are required and why.

### What else belongs in `qa.md`

- executable Markdown test cases
- preconditions
- step-by-step verification
- expected results
- regression checks
- edge cases
- rerun guidance after bug fixes

### Common mistake

Do not write only "add tests" or "use vitest/playwright". Good QA planning explains what should be tested, at which level, and what outcome proves the change is correct.

## Deploy doc

`deploy.md` explains how the change reaches a real environment safely.

### What belongs here

- environment assumptions
- deployment method
- rollout steps
- rollback or recovery plan
- operational checks after release

### How deploy differs from dev and QA

- `develop.md` is about implementation design,
- `qa.md` is about verification,
- `deploy.md` is about safe release and operational confidence.

### Common mistake

Do not treat deploy as an afterthought. Even documentation or process changes may require a publish path, release note, or docs visibility check.

## What happens after approval

An approved proposal should not remain only inside `pmate-proposal`.

When the proposal leads to real implementation or a repeatable workflow, the key operational knowledge should also be captured in `pmate-mono` dev docs:

- `apps/dev-docs/docs/en/guide/`
- `apps/dev-docs/docs/cn/guide/`

That follow-up guide should explain:

- what was approved,
- how to execute the workflow in practice,
- which terms or decisions usually confuse contributors,
- which repo paths or commands matter during implementation.

This keeps proposals useful for planning while keeping long-term implementation knowledge in the developer docs site.
