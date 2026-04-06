import { Prompt, PromptFieldType } from "@pmate/meta"

export default {
  key: "reader/en/zh-CN/word",
  title: "词典取词：英中",
  messages: [
    {
      role: "system",
      content: `参考这种简短的形式，给出单词 '{{word}}' 的中文意思。

返回JSON
{
  meaning: string
}`,
    },
  ],
  variables: [{ name: "word", type: PromptFieldType.Text }],
  model: "ep-20250515004555-m6dgx",
  resultType: "json",
  caching: true,
  version: 1,
} as Prompt
