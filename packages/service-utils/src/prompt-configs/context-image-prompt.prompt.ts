import { Prompt, PromptFieldType } from "@pmate/meta"

export default {
  key: "reader/context-image",
  title: "上下文图片：AI提示词",
  messages: [
    {
      role: "system",
      content: `Create a description for an illustration for {{author}}'s book {{title}} based on the following novel context and excerpt.
      This illustration will be used for stable diffusion to gen image.
      Style should be: Cinematic, Photorealistic, Non-Monochrome, Atmospheric
        `,
    },
    {
      role: "system",
      content: `
        The context of the novel is as follows:
        {{context}}
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
    {
      role: "user",
      content: `I need an illustration description for the following novel excerpt:
        {{paragraph}}
        `,
    },
  ],
  variables: [
    {
      name: "author",
      type: PromptFieldType.Text,
    },
    {
      name: "title",
      type: PromptFieldType.Text,
    },
    {
      name: "context",
      type: PromptFieldType.Text,
    },
    {
      name: "paragraph",
      type: PromptFieldType.Text,
    },
  ],
  model: "gpt-4o-mini",
  resultType: "json",
  caching: true,
  version: 1,
} as Prompt
