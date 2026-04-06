import { Prompt, PromptFieldType } from "@pmate/meta"

export default {
  key: "reader/ko-KR/zh-CN/context-words",
  title: "文中词汇解释：韩词中文",
  messages: [
    {
      role: "system",
      content: `作为中文教师，请解释《{{title}}》这段韩语中的词汇和词组：

{{sentence}}

- 不要遗漏词汇或词组，可合并解释
- 每组解释尽量简短

interface AIPhraseExplain {
  wordOrPhrase: string
  explain: string
}

请按上述类型返回JSON：
{
  list: AIPhraseExplain[]
}`,
    },
  ],
  variables: [
    { name: "title", type: PromptFieldType.Text },
    { name: "sentence", type: PromptFieldType.Text },
  ],
  model: "ep-20250515004555-m6dgx",
  resultType: "json",
  caching: true,
  version: 1,
} as Prompt
