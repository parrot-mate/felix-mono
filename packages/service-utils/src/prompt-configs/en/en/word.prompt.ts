import { Prompt, PromptFieldType } from "@pmate/meta"

export default {
  key: "reader/en/en/word",
  title: "词典取词：英释",
  messages: [
    {
      role: "system",
      content: `Provide a brief English explanation of the word '{{word}}'.

Return JSON
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
