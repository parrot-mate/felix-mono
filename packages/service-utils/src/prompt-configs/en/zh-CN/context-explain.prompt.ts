import { Prompt, PromptFieldType } from "@pmate/meta"

export default {
  key: "reader/en/zh-CN/context-explain",
  title: "上下文解释",
  messages: [
    {
      role: "system",
      content: `你是一名老师，用户在学习英文，根据给定的上下文帮用户分析其中一句的含义。

根据[上下文]对下面段落讲解：
- 先提供段落的中文翻译
- 结合上下文解读下情节
- 然后挑选难点词汇/短语进行讲解
- 然后提供其中一个语法难点分析(如有)
        `,
    },
    {
      role: "system",
      content: `这是关联的[上下文]:
{{context}}
`,
    },
    {
      role: "user",
      content: `请给我讲解这个句子在上下文中的含义:
{{sentence}}`,
    },
  ],
  variables: [
    {
      name: "context",
      type: PromptFieldType.Text,
    },
    {
      name: "sentence",
      type: PromptFieldType.Text,
    },
  ],
  model: "ep-20250515004555-m6dgx",
  resultType: "text",
  caching: true,
  version: 1,
} as Prompt
