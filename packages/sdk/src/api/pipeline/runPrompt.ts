import { HashType, Logger, lru, uniqHash } from "@pmate/utils"
import {
  AIPhraseExplain,
  PromptKeys,
  PromptPhraseExplainResult,
  PromptReturnTypeMap,
  PromptReturnTypeTransform,
} from "@pmate/meta"
import { isArray } from "lodash"
import { PipelineWorkerClient } from "@sdk/socket/PipelineWorkerClient"
import { KVCacheDB } from "@sdk/util"

const logger = Logger.getDebugger("runPromptAtom")

type PromptCacheValue = PromptReturnTypeMap[PromptKeys]

type TransformablePromptKey = keyof PromptReturnTypeTransform

type TransformFunctionTable = {
  [K in TransformablePromptKey]: (
    value: unknown
  ) => PromptReturnTypeTransform[K]
}

const transformContextWords = (value: unknown): AIPhraseExplain[] => {
  if (!value || typeof value !== "object") {
    return []
  }

  const { list } = value as PromptPhraseExplainResult

  if (!Array.isArray(list)) {
    return []
  }

  return list.filter(
    (item): item is AIPhraseExplain =>
      !!item &&
      typeof item === "object" &&
      typeof item.wordOrPhrase === "string" &&
      typeof item.explain === "string"
  )
}

const transformFunctionTable: TransformFunctionTable = {
  "reader/en/en/context-words": transformContextWords,
  "reader/en/zh-CN/context-words": transformContextWords,
  "reader/ko-KR/en/context-words": transformContextWords,
  "reader/ko-KR/zh-CN/context-words": transformContextWords,
  "reader/zh-CN/en/context-words": transformContextWords,
  "reader/zh-CN/zh-CN/context-words": transformContextWords,
}

const applyTransformForType = <T extends PromptKeys>(
  type: T,
  value: unknown
): PromptReturnTypeMap[T] => {
  if (typeof value === "undefined") {
    return value as unknown as PromptReturnTypeMap[T]
  }

  const transform = transformFunctionTable[type as TransformablePromptKey]

  if (!transform) {
    return value as PromptReturnTypeMap[T]
  }

  if (Array.isArray(value)) {
    return value as PromptReturnTypeMap[T]
  }

  return transform(value) as PromptReturnTypeMap[T]
}

function isEmpty(val: any) {
  if (val == null) return true
  if (isArray(val) && val.length === 0) return true
  if (typeof val === "object" && Object.keys(val).length === 0) return true
  return false
}

const getPromptCache = (): KVCacheDB<PromptCacheValue> => {
  return KVCacheDB.getDB<PromptCacheValue>()
}

const getPromptHash = (type: PromptKeys, variables: Record<string, any>) =>
  uniqHash({ type, variables }, HashType.Prompt)

const runPromptInternal = lru(
  async (type: PromptKeys, variables: Record<string, any>) => {
    const cacheKey = getPromptHash(type, variables)
    const promptCache = getPromptCache()

    const cachedValue = await promptCache.get(cacheKey)
    if (!isEmpty(cachedValue)) {
      logger.log("runPrompt cache hit", { type, cacheKey, cachedValue })
      return cachedValue as PromptReturnTypeMap[PromptKeys]
    }

    const params = {
      type: "run-prompt",
      params: {
        type,
        variables,
      },
    }

    const pipeline = await PipelineWorkerClient.current()
    logger.log("runPrompt", params)
    const result = await pipeline.run("@gpt#1", params)
    logger.log("succ", result)
    const normalizedResult = applyTransformForType(type, result)
    logger.log("normalized", normalizedResult)

    if (promptCache && !isEmpty(normalizedResult)) {
      try {
        await promptCache.set(cacheKey, normalizedResult as PromptCacheValue)
      } catch {
        // Ignore cache write errors so prompt still resolves.
      }
    }

    return normalizedResult
  },
  {
    ttl: 10_000,
    key: (type, variables) => getPromptHash(type, variables),
  }
) as <T extends PromptKeys>(
  type: T,
  variables: Record<string, any>
) => Promise<PromptReturnTypeMap[T]>

export const runPrompt = async <T extends PromptKeys>(
  type: T,
  variables: Record<string, any>
): Promise<PromptReturnTypeMap[T]> => {
  return runPromptInternal(type, variables)
}
