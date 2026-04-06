# Test Cases: Markdown tutorial

## Scope

Validate the new Markdown tutorial in both English and Chinese.

Target docs:

- `apps/dev-docs/docs/en/guide/markdown-tutorial.md`
- `apps/dev-docs/docs/cn/guide/markdown-tutorial.md`

## Test Case: Tutorial is reachable from navigation

- Scenario: A user opens the `Guide` section in the docs app.
- Preconditions: `apps/dev-docs/src/pages/docsContent.tsx` includes the new tutorial item.
- Steps:
  1. Start the local dev-docs app or inspect the built app.
  2. Open the `Guide` section.
  3. Look for the Markdown tutorial entry.
- Expected Result: The tutorial appears in navigation and routes correctly in both `en` and `cn`.

## Test Case: English tutorial explains basic Markdown grammar

- Scenario: A beginner reads the English tutorial.
- Preconditions: The English markdown file renders successfully.
- Steps:
  1. Open `/en/guide/markdown-tutorial`.
  2. Read the sections for headings, lists, links, emphasis, blockquotes, and code blocks.
- Expected Result: The page clearly explains what Markdown is and how the core grammar works.

## Test Case: Chinese tutorial mirrors the same teaching scope

- Scenario: A Chinese-speaking reader opens the localized tutorial.
- Preconditions: The Chinese markdown file renders successfully.
- Steps:
  1. Open `/cn/guide/markdown-tutorial`.
  2. Read the same core syntax sections.
  3. Compare the scope with the English tutorial.
- Expected Result: The Chinese tutorial covers the same core concepts with no major omissions.

## Test Case: Markdown examples render correctly

- Scenario: The tutorial includes examples for headings, lists, links, blockquotes, inline code, fenced code blocks, and Mermaid.
- Preconditions: The page is visible in the browser or built output.
- Steps:
  1. Open the tutorial page.
  2. Inspect the rendered examples.
  3. Confirm that example source blocks stay escaped where intended.
  4. Confirm that rendered examples display as described.
- Expected Result: The tutorial demonstrates the grammar accurately without broken rendering.

## Test Case: Rendering guidance is accurate

- Scenario: A user reads the section that explains how Markdown is rendered in PMate dev-docs.
- Preconditions: The rendering section is present in both localized pages.
- Steps:
  1. Read the rendering explanation.
  2. Compare the claims with the current docs implementation.
- Expected Result: The tutorial accurately states that content is imported from Markdown files, rendered by the existing Vike + React app, and supports code highlighting plus Mermaid processing.

## Test Case: Build succeeds after adding the tutorial

- Scenario: The docs app is built after the tutorial is added and registered.
- Preconditions: Dependencies are installed.
- Steps:
  1. Run `pnpm --filter @pmate/dev-docs build`.
- Expected Result: The build passes without Markdown import, compile, or route errors.
