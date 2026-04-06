import { Prompt, PromptFieldType } from "@pmate/meta"

export default {
  key: "reader/en/en/context-question",
  title: "用户提问-英英",
  messages: [
    {
      role: "system",
      content: `User is reading a book. Answer users' question based on the book context.
        book: {{title}}
        context: {{context}}
        Answer in English.
        Return JSON: { answer: string }
        `,
    },
    {
      role: "user",
      content: `
        Question: {{question}}
        `,
    },
  ],
  variables: [
    { name: "title", type: PromptFieldType.Text },
    { name: "context", type: PromptFieldType.Text },
    { name: "question", type: PromptFieldType.Text },
  ],
  model: "gpt-4.1",
  resultType: "json",
  caching: true,
  version: 1,
} as Prompt
