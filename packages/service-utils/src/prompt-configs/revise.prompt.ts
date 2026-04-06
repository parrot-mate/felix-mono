import { Prompt, PromptFieldType } from "@pmate/meta"

export default {
  key: "chat/revise",
  title: "Revise Prompt",
  messages: [
    {
      content: `
      
Help revise this sentence in {{lang}}:

Return JSON:
{
  "revised": "string"
}`,
      role: "system",
    },
    {
      content: "sentence to revise: {{text}} ",
      role: "user",
    },
  ],
  variables: [
    {
      name: "lang",
      type: PromptFieldType.Language,
    },
    {
      name: "text",
      type: "text",
    },
    {
      name: "history",
      type: "text",
    },
  ],
  model: "gpt-5-nano",
  resultType: "json",
  caching: false,
  version: 1,
} as Prompt
