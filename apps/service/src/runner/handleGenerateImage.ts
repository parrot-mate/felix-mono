import { lru, uniqHashForAIImage } from "@pmate/utils"
import { AIImgRequest, AIImgType, PromptKeys } from "@pmate/meta"
import { plusGenerateImage } from "../service/plusGenerateImage"
import { POSS } from "../util/alioss"
import { handleRunPrompt } from "./handleRunPrompt"

function getPromptKeyAndVariables(
  o: AIImgRequest<AIImgType>
): [PromptKeys, Record<string, any>] {
  const { type, params } = o
  switch (type) {
    case AIImgType.ParagraphIllustrate:
      return ["reader/context-image", params]
    case AIImgType.BookCover:
      return ["reader/book-cover", params]
    case AIImgType.WordExplain:
      return ["reader/word-image", params]
    default:
      throw new Error(`Unknown AIImgType: ${type}`)
  }
}

const _handleGenerateImage = async (params: AIImgRequest<AIImgType>) => {
  const [promptKey, variables] = getPromptKeyAndVariables(params)
  const hash = uniqHashForAIImage(params)
  const key = `/plus-images/${hash}.webp`
  const exists = await POSS.publicOSS.existsOSS(key)
  if (exists) {
    return
  }

  const result: {
    illustration: string
  } | null = await handleRunPrompt({
    type: promptKey,
    variables,
  })
  if (!result) {
    throw new Error(`Prompt Generate Fail.`)
  }

  const promptStr = result.illustration
  await plusGenerateImage(hash, promptStr)
}

export const handleGenerateImage = lru(_handleGenerateImage, {
  ttl: 60_000,
  key: (params) => {
    if (params.type === AIImgType.ParagraphIllustrate) {
      // @ts-ignore
      return JSON.stringify([
        params.type,
        params.params.paragraph,
        params.title,
        params.author,
      ])
    }
    return JSON.stringify(params)
  },
})
