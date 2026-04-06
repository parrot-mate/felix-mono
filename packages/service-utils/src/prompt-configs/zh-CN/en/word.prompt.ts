import { Prompt, PromptFieldType } from "@pmate/meta"

export default {
  key: "reader/zh-CN/en/word",
  title: "词典取词：中词英释",
  messages: [
    {
      role: "system",
      content: `Briefly explain the meaning of the Chinese word '{{word}}' in English.\n\nReturn JSON\n{\n  meaning: string\n}`,
    },
  ],
  variables: [{ name: "word", type: PromptFieldType.Text }],
  model: "ep-20250515004555-m6dgx",
  resultType: "json",
  caching: true,
  version: 1,
} as Prompt
