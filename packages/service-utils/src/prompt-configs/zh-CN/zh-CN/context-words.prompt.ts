import { Prompt, PromptFieldType } from "@pmate/meta"

export default {
  key: "reader/zh-CN/zh-CN/context-words",
  title: "文中词汇解释：中文",
  messages: [
    {
      role: "system",
      content: `作为汉语学者，请对《{{title}}》 这段话进行逐字、逐词的结束：

{{sentence}}

- 进行逐字、逐词的解
- 除了一些常见的介词，比如“的”、“了”、“在”等，可以不解释


interface AIPhraseExplain {
  wordOrPhrase: string // 字、词
  explain: string // 中文含义和拼音(请尽量简短)
                  // 格式： (拼音) 解释
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
  version: 2,
} as Prompt
