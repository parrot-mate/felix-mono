import {
  OfflineCacheType,
  type LangShort,
  type PromptKeys,
  type SimpleWord,
} from "@pmate/meta"
import { Logger } from "@pmate/utils"
import { runPrompt } from "@sdk/api/pipeline/runPrompt"
import { withOffline } from "@sdk/util/offlineUtils"

const logger = Logger.getDebugger("aiGenWord")

export const aiGenWord = withOffline(
  OfflineCacheType.Word,
  async (params: { word: string; lang: LangShort; userLang: LangShort }) => {
    const key = `reader/${params.lang}/${params.userLang}/word` as PromptKeys
    logger.log("prompt-key", key)
    const meaning = await runPrompt(key, {
      word: params.word,
      lang: params.lang,
    })

    if (
      !meaning ||
      typeof meaning !== "object" ||
      typeof (meaning as { meaning?: unknown }).meaning !== "string"
    ) {
      return null
    }

    const meaningResult = meaning as { meaning: string }
    const meanings = meaningResult.meaning.split("@")
    const sw: SimpleWord = {
      w: params.word,
      l: meanings.map((a) => {
        const [pos, m] = a.split(".")
        return [pos, m]
      }),
    }
    return sw
  }
)
