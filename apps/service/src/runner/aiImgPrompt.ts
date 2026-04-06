import { AIImgParams, AIImgRequest, AIImgType } from "@pmate/meta"

import { OpenAI } from "openai"
import { getJSONAnswerFromOpenAI } from "./openAI"

const MAX_WORD = 25
export const aiImgPrompt = async <T extends AIImgType>(
  req: AIImgRequest<T>
) => {
  let prompt: OpenAI.ChatCompletionMessageParam[] = []
  const { type, params } = req

  switch (type) {
    case AIImgType.WordExplain: {
      const { word } = params as AIImgParams[AIImgType.WordExplain]
      prompt = wordPrompt(word)
      break
    }
    case AIImgType.ParagraphIllustrate: {
      const { paragraph, title, author, context } =
        params as AIImgParams[AIImgType.ParagraphIllustrate]
      prompt = paragraphIllustratePrompt(context, paragraph, title, author)
      break
    }
    case AIImgType.BookCover: {
      const { title } = params as AIImgParams[AIImgType.BookCover]
      prompt = bookCover(title)
      break
    }
    default:
      throw new Error(`Invalid prompt type: ${type}`)
  }
  const answer = await getJSONAnswerFromOpenAI<{
    illustration: string
  }>("gpt-4o-mini", prompt)
  if (type === AIImgType.ParagraphIllustrate && answer?.illustration) {
    return `[Cinematic, Photorealistic, Non-Monochrome]${answer?.illustration.trim()}`
  }
  return answer?.illustration.trim()
}

const IMGDESC = `
requirements:

1. Word Limit: The prompt must not exceed ${MAX_WORD} tokens to ensure brevity while maintaining clarity.
2. Compact Format: The prompt should focus on essential visual elements, with minimal filler words. Use precise and concise descriptions. For example:
3. "a beautiful mountain landscape at sunrise" -> "mountain landscape, sunrise"
4. "A warrior with a sword standing in the foggy forest" -> "warrior, sword, foggy forest"
5. Rich Visual Elements: The description should include key visual aspects like subject, setting, mood, color, lighting, and style, while avoiding redundancy.
6. Balanced Detail: Maximize descriptive detail but keep it brief. Focus on what's essential to the visual composition.

Return In JSON  format ,
return type is : {
  illustration: string 
} 
`

const wordPrompt = (word: string): OpenAI.ChatCompletionMessageParam[] => [
  {
    role: "system",
    content: `
  Generate an image description for english learners of the meaning of word '${word}'.

${IMGDESC}
`,
  },
]

const bookCover = (title: string): OpenAI.ChatCompletionMessageParam[] => [
  {
    role: "system",
    content: `
  Generate a book cover for the following book.

  book: ${title}


${IMGDESC}

`,
  },
]

const paragraphIllustratePrompt = (
  context: string,
  paragraph: string,
  title: string,
  author: string
): OpenAI.ChatCompletionMessageParam[] => {
  return [
    {
      role: "system",
      content: `
      Create a description for an illustration for ${author}'s book ${title} based on the following novel context and excerpt.
      This illustration will be used for stable diffusion to gen image. 
      Style should be: Cinematic, Photorealistic, Non-Monochrome, Atmospheric

      ${IMGDESC}
    `,
    },
    {
      role: "system",
      content: `
      The context of the novel is as follows: 
      ${context}
    `,
    },
    {
      role: "user",
      content: `
      I need an illustration description for the following novel excerpt:
      ${paragraph}
    `,
    },
  ]
}
