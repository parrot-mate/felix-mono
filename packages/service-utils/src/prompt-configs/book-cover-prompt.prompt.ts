import { Prompt, PromptFieldType } from "@pmate/meta"

export default {
  key: "reader/book-cover",
  title: "书籍封面：AI提示词",
  messages: [
    {
      role: "system",
      content: `Generate a book cover for the following book.
        book: {{title}}
        `,
    },
    {
      role: "system",
      content: `
        requirements:
1. Word Limit: The prompt must not exceed 50 tokens to ensure brevity while maintaining clarity.
2. Compact Format: The prompt should focus on essential visual elements, with minimal filler words. Use precise and concise descriptions. For example:
3. "a beautiful mountain landscape at sunrise" -> "mountain landscape, sunrise"
4. "A warrior with a sword standing in the foggy forest" -> "warrior, sword, foggy forest"
5. Rich Visual Elements: The description should include key visual aspects like subject, setting, mood, color, lighting, and style, while avoiding redundancy.
6. Balanced Detail: Maximize descriptive detail but keep it brief. Focus on what's essential to the visual composition.

Return In JSON  format ,
return type is : {
  illustration: string
}
        `,
    },
  ],
  variables: [
    {
      name: "title",
      type: PromptFieldType.Text,
    },
  ],
  model: "ep-20250515004555-m6dgx",
  resultType: "json",
  caching: true,
  version: 1,
} as Prompt
