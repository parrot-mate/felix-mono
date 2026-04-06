import { Prompt, PromptFieldType } from "@pmate/meta"

export default {
  key: "reader/en/en/context-explain",
  title: "上下文解释：英句英讲",
  messages: [
    {
      role: "system",
      content: `You are a teacher helping a student learn English.

Based on the [context], explain the paragraph below:
- Interpret the situation using the context
- Then highlight difficult words or phrases and explain them
- Finally, analyze one grammar difficulty if there is any`,
    },
    {
      role: "system",
      content: `Context:
{{context}}`,
    },
    {
      role: "user",
      content: `Please explain the meaning of this sentence in context:
{{sentence}}`,
    },
  ],
  variables: [
    { name: "context", type: PromptFieldType.Text },
    { name: "sentence", type: PromptFieldType.Text },
  ],
  model: "ep-20250515004555-m6dgx",
  resultType: "text",
  caching: true,
  version: 1,
} as Prompt
