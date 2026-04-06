# Test Cases: Key knowledge in the proposal process

## Scope

Validate the new `dev-docs` guide for proposal-process knowledge in both English and Chinese.

Target docs:

- `apps/dev-docs/docs/en/guide/proposal-process-key-knowledge.md`
- `apps/dev-docs/docs/cn/guide/proposal-process-key-knowledge.md`

## Test Case: Guide is reachable from navigation

- Scenario: A user opens the `Guide` section in the docs app.
- Preconditions: `apps/dev-docs/src/pages/docsContent.tsx` includes the new guide item.
- Steps:
  1. Start the local dev-docs app or inspect the built app.
  2. Open the Guide section.
  3. Look for the new proposal-process guide entry.
- Expected Result: The new guide appears in navigation and routes to the correct page in both `en` and `cn`.

## Test Case: English guide teaches the four proposal documents

- Scenario: A first-time contributor reads the English guide.
- Preconditions: The English markdown file is rendered successfully.
- Steps:
  1. Open `/en/guide/proposal-process-key-knowledge`.
  2. Read the sections for `Product`, `Dev doc`, `QA doc`, and `Deploy doc`.
- Expected Result: The guide explains what each document is for and what content belongs there.

## Test Case: QA section explains test levels clearly

- Scenario: A contributor is unsure about unit, integration, and e2e testing.
- Preconditions: The QA section is visible in the guide.
- Steps:
  1. Read the QA section.
  2. Compare the definitions for unit, integration, and e2e tests.
- Expected Result: The distinctions are clear, and the reader can tell why each test level may be required in a proposal.

## Test Case: Chinese guide mirrors the same knowledge

- Scenario: A Chinese-speaking contributor reads the localized guide.
- Preconditions: The Chinese markdown file is rendered successfully.
- Steps:
  1. Open `/cn/guide/proposal-process-key-knowledge`.
  2. Read the sections for `Product`, `Dev doc`, `QA doc`, and `Deploy doc`.
  3. Verify that the QA section explains `unit test`, `integration test`, and `e2e test`.
- Expected Result: The Chinese guide teaches the same core concepts as the English guide, with no major omissions.

## Test Case: Approval handoff to dev-docs is explicit

- Scenario: A reviewer wants to know what happens after proposal approval.
- Preconditions: The guide includes an approval handoff section.
- Steps:
  1. Read the final section of the guide.
  2. Identify the target documentation paths.
- Expected Result: The guide clearly states that long-term implementation knowledge should be captured in `apps/dev-docs/docs/en/guide/` and `apps/dev-docs/docs/cn/guide/`.
