import type { SummaryResult, ProposalInput } from "./types.js"

export function toPrdLiteMarkdown(input: ProposalInput, result: SummaryResult): string {
  return `# ${input.productName}

## Goal
${input.productGoal}

## Background
${input.background}

## Tech Stack
${input.techStack}

## UI Style
${input.uiStyle}

## Core Features
${input.coreFeatures ?? ""}

## AI Summary
${result.summary}

## Key Questions
${result.keyQuestions.map((question) => `- ${question}`).join("\n")}
`
}
