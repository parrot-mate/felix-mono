import { AIImgType } from "@pmate/meta"
import type { AIImgRequest, LangShort, Prompt } from "@pmate/meta"
import { keccak256 } from "js-sha3"

export enum HashType {
  OUTLINE = "outline-v2",
  TEXT = "text-v1",
  JSON = "json-v1",
  MESSAGE = "message-v1",
  THREAD = "thread-v1.3",
  NOVEL = "novel-v1",
  FS = "fs-v1",
  PRJ = "prj-v1",
  PROMPT_IMAGE = "prompt-image-v1",
  MSG = "msg-v1",
  UserLog = "user-log-v1",
  Task = "task-v1",
  AIImg = "ai-img-v2.3",
  VOICE = "voice-v1",
  Prompt = "prompt-v1",
  Offline = "offline-v1",
  cacheMethod = "cacheMethod-v1",
  ReadingQA = "reading-qa-v1",
}

const sortKeys = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(sortKeys)
  }
  if (obj && typeof obj === "object") {
    return Object.keys(obj)
      .sort()
      .reduce((sortedObj, key) => {
        sortedObj[key] = sortKeys(obj[key])
        return sortedObj
      }, {} as any)
  }
  return obj
}

export const uniqHash = (input: string | object, type: HashType) => {
  let str: string

  if (typeof input === "object") {
    const sortedObject = sortKeys(input)
    str = JSON.stringify(sortedObject)
  } else {
    str = input
  }

  str = str
    .replace(/\s+/g, "")
    .replace(/[\n\r\t]+/g, "")
    .toLowerCase()

  return keccak256(str + "@" + type)
}

export const uniqHashForVoice = (
  provider: string,
  text: string,
  voice: string,
  lang: LangShort,
  instructions: string,
  timePoints: boolean
) => {
  return uniqHash(
    {
      provider,
      text,
      voice,
      lang,
      instructions,
      timePoints,
    },
    HashType.VOICE
  )
}

export const uniqHashForAIImage = (req: AIImgRequest<AIImgType>) => {
  const { type, params } = req
  if (type === AIImgType.ParagraphIllustrate) {
    const newRep = {
      type,
      params: {
        ...params,
        context: "",
      },
    }
    return uniqHash(newRep, HashType.AIImg)
  }
  return uniqHash(req, HashType.AIImg)
}

export const uniqHashForPrompt = (
  prompt: Prompt,
  fields: Record<string, any>
) => {
  const fieldsStr = JSON.stringify(fields)
  const promptStr = `${prompt.key}/${prompt.model}/${prompt.version}`
  const hash = uniqHash(`${promptStr}${fieldsStr}`, HashType.Prompt)
  return hash
}
