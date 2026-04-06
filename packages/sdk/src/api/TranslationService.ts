import { Logger } from "@pmate/utils"
import type { LangShort } from "@pmate/meta"
import { OfflineCacheType } from "@pmate/meta"
import { PipelineWorkerClient } from "@sdk/socket/PipelineWorkerClient"
import { runPrompt } from "@sdk/api/pipeline/runPrompt"
import { withOffline } from "@sdk/util/offlineUtils"

const aiTranslateLogger = Logger.getDebugger("aiTranslate")
const apiTranslationLogger = Logger.getDebugger("apiTranslation")

const aiTranslateCore = withOffline(
  OfflineCacheType.Translation,
  async ({
    langSource,
    langTarget,
    text,
    context,
  }: {
    langSource: LangShort
    langTarget: LangShort
    text: string
    context?: string
  }) => {
    if (!text) {
      return null
    }
    if (langSource === langTarget) {
      return text
    }
    try {
      const result = await runPrompt("chat/translation", {
        srcLang: langSource,
        tarLang: langTarget,
        text,
        context: context || "",
      })
      return result?.translation ?? null
    } catch (error) {
      aiTranslateLogger.error(error)
      return null
    }
  }
)

const apiTranslationCore = withOffline(
  OfflineCacheType.Translation,
  async ({
    langSource,
    langTarget,
    text,
  }: {
    langSource: LangShort
    langTarget: LangShort
    text: string
  }) => {
    apiTranslationLogger.log("send", {
      langSource,
      langTarget,
      text,
    })
    const client = await PipelineWorkerClient.current()
    const result = await client.request("@trans#1", {
      text,
      langSource,
      langTarget,
    })
    apiTranslationLogger.log(result)
    return result as string | null
  }
)

export class TranslationService {
  public static aiTranslate(
    srcLang: LangShort,
    tarLang: LangShort,
    text: string,
    context: string
  ) {
    return aiTranslateCore({
      langSource: srcLang,
      langTarget: tarLang,
      text,
      context,
    })
  }

  public static apiTranslation(
    langSource: LangShort,
    langTarget: LangShort,
    text: string
  ) {
    return apiTranslationCore({ langSource, langTarget, text })
  }
}
