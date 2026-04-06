# Project Structure

For UI or Node projects are in vite under apps/\* folder.

## Vite project structure

- components
  - @pmate/uikit: stateless project
  - src/component: basically for domain specific components
  - src/atom: for atoms
  - src/hook: for hooks
  - src/util: for project specific util functions
  - @pmate/utils: for common util functions
  - provider: for providers
  - src/pages: for pages. filename should be {pathname}.tsx.

## Styling

1. For Box, change to div with tailwind css.
2. When you happens modify a tsx file:

- replace mui's components by @pmate/uikit's component
- replace sx and styled with twaiwind css.

3. When you need do some fetch logic, put them into a proper atom/atomFamily (jotai)

## About Normalize

- Try to do minimal normalized when write code.
  e.g. when we have a function with `userId` as params. The passed in `userId` is string, then you don't need check if `userId` === ''.
- Try to trust the previous layer.

## Docs (About Section)

- When editing docs that describe a tool or API, add a short "Background/背景" section (1-2 paragraphs) that covers the pain point, what the tool solves, and any relevant context. Skip this for purely manual docs.
- For the first doc under each layer-1 menu, use a longer Background/背景 section (3-4 paragraphs) that explains the purpose, scope, and high-level context of that section.
