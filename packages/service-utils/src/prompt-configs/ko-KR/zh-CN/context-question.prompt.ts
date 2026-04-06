import { Prompt, PromptFieldType } from "@pmate/meta"

export default {
  key: "reader/ko-KR/zh-CN/context-question",
  title: "用户提问-韩中",
  messages: [
    {
      role: "system",
      content: `用户在阅读一本书，请结合书中的内容回答用户的问题。
        book: {{title}}
        context: {{context}}
        请用中文回答。
        Return JSON: { answer: string }
        `,
    },
    {
      role: "user",
      content: `
        用户提问：{{question}} 
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
