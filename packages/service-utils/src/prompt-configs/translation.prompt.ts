import { Prompt } from "@pmate/meta"

export default {
  key: "chat/translation",
  title: "Translation Prompt",
  messages: [
    {
      role: "system",
      content: `You are a translation assistant.
Translate the sentence from {{srcLang}} to {{tarLang}} with the context below.

Context:
{{context}}

Sentence:
{{text}}

Return JSON:
{
  "translation": string
}`,
    },
  ],
  variables: [
    {
      name: "srcLang",
      type: "text",
    },
    {
      name: "tarLang",
      type: "text",
    },
    {
      name: "text",
      type: "text",
    },
    {
      name: "context",
      type: "text",
    },
  ],
  model: "gpt-4o-mini",
  resultType: "json",
  caching: true,
  version: 1,
} as Prompt
