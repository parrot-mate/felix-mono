import { Prompt, PromptFieldType } from "@pmate/meta"

export default {
  key: "reader/zh-CN/zh-CN/context-explain",
  title: "上下文解释：中文",
  messages: [
    {
      role: "system",
      content: `请结合上下文，用中文讲解下列句子的含义。`,
    },
    {
      role: "system",
      content: `这是关联的[上下文]:
{{context}}`,
    },
    {
      role: "user",
      content: `请解释这句话在上下文中的含义:
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
