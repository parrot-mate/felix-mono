import { Prompt, PromptFieldType } from "@pmate/meta"

export default {
  key: "reader/en/en/context-words",
  title: "文中词汇解释：英词英释",
  messages: [
    {
      role: "system",
      content: `Please explain the following English sentence from '{{title}}' in English, focusing on vocabulary and phrases:

{{sentence}}

- Do not skip words or phrases
- Keep explanations short

interface AIPhraseExplain {
  wordOrPhrase: string
  explain: string
}

Return JSON:
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
