import { memoizeAsync, uniqHashForPrompt } from "@pmate/utils"
import { ModelType, Prompt, RunPromptParams } from "@pmate/meta"
import { Models } from "@pmate/service-utils"
import { POSS } from "../util/alioss"
import { getJSONAnswerFromOpenAI, getTextAnswerFromOpenAI } from "./openAI"

const loadPrompt = memoizeAsync(
  async (promptKey: string) => {
    const prompt = await POSS.publicOSS.getResourceOSS<Prompt>(
      `prompts/${promptKey}.json`
    )
    return prompt ?? null
  },
  {
    resolver: (promptKey) =>
      `${promptKey}/${Math.floor(Date.now() / 10_000)}`,
    isValid: (prompt): prompt is Prompt => prompt !== null,
  }
)

export const handleRunPrompt = async (params: RunPromptParams) => {
  const { type, variables } = params
  const prompt = await getPrompt(type)
  const modelKey = prompt.model

  const model = Models[modelKey as keyof typeof Models]
  if (!model) {
    throw new Error(`Model ${modelKey} not found`)
  }

  if (model.type === ModelType.Chat) {
    return runChatPrompt(prompt, variables)
  }

  throw new Error(`Model ${modelKey} not supported`)
}

export const getPrompt = async (key: string) => {
  const prompt = await loadPrompt(key)
  if (!prompt) {
    throw new Error(`Prompt ${key} not found`)
  }
  return prompt
}

class Perf {
  private records: {
    key: string
    time: number
    logs: any[]
  }[] = []

  private t: number = Date.now()
  constructor(private title: string) {}

  flush() {
    console.log(`\n\n=== ${this.title} ===`)
    console.log(`time:`, new Date(this.t).toString())
    for (const record of this.records) {
      console.log(`[${record.key}] ${record.time}ms`)
      console.log(...record.logs)
    }
  }

  log(key: string, ...logs: any[]) {
    this.records.push({
      key,
      time: Date.now() - this.t,
      logs,
    })
  }
}
const runChatPrompt = async (
  prompt: Prompt,
  variables: Record<string, any>
) => {
  const perf = new Perf("runChatPrompt")
  const key = `${prompt.key}/${uniqHashForPrompt(prompt, variables)}.json`
  perf.log("start", prompt.key, prompt.model)
  try {
    if (prompt.caching) {
      const exists = await POSS.publicOSS.existsOSS(key)
      if (exists) {
        const json = await POSS.publicOSS.getResourceOSS(key)
        return json
      }
    }
    perf.log("after - check-cache")
    const messages = prompt.messages.map((msg) => {
      return {
        ...msg,
        content: replaceTemplateValue(msg.content, variables),
      }
    })
    perf.log(`req`, messages)

    const fn =
      prompt.resultType === "text"
        ? getTextAnswerFromOpenAI
        : getJSONAnswerFromOpenAI
    const answer: any = await fn(prompt.model as keyof typeof Models, messages)
    perf.log(`ans`, answer)
    if (prompt.caching && answer) {
      const result = await POSS.publicOSS.uploadJsonToOSS(key, answer)
      perf.log(`cache-save`, result.url)
    }
    perf.log("succ")
    return answer
  } catch (e) {
    perf.log("err", e)
    throw e
  } finally {
    perf.flush()
  }
}

function replaceTemplateValue(content: string, variables: Record<string, any>) {
  const regex = /{{(.*?)}}/g
  return content.replace(regex, (match, p1) => {
    const key = p1.trim()
    return variables[key] || match
  })
}

export function getPromptKey(prompt: Prompt, variables: Record<string, any>) {
  return `${prompt.key}/${uniqHashForPrompt(prompt, variables)}`
}
