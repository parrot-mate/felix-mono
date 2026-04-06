import { Prompt, PromptFieldType } from "@pmate/meta"

export default {
  key: "reader/ko-KR/en/context-explain",
  title: "上下文解释：韩句英讲",
  messages: [
    {
      role: "system",
      content: `You are a teacher helping a student learn Korean. Based on the provided context, explain the sentence in English.`,
    },
    {
      role: "system",
      content: `这是关联的[上下文]:
{{context}}`,
    },
    {
      role: "user",
      content: `请用英文解释这句话在上下文中的含义:
{{sentence}}`,
    },
  ],
  variables: [
    { name: "context", type: PromptFieldType.Text },
    { name: "sentence", type: PromptFieldType.Text },
  ],
  model: "ep-20250515004555-m6dgx",
  resultType: "text",
  caching: true,
  version: 1,
} as Prompt
