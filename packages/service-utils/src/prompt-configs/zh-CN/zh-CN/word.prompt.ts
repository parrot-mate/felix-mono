import { Prompt, PromptFieldType } from "@pmate/meta"

export default {
  key: "reader/zh-CN/zh-CN/word",
  title: "词典取词：中文解释",
  messages: [
    {
      role: "system",
      content: `请简要解释中文词语 '{{word}}' 的含义，返回 JSON：\n{\n  meaning: string\n}`,
    },
  ],
  variables: [{ name: "word", type: PromptFieldType.Text }],
  model: "ep-20250515004555-m6dgx",
  resultType: "json",
  caching: true,
  version: 1,
} as Prompt
