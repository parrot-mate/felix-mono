import { Models } from "@pmate/service-utils"
import OpenAI from "openai"
import { extractContent } from "../util/extractJSONContent"

export async function getJSONAnswerFromOpenAI<T>(
  modelKey: keyof typeof Models,
  messages: OpenAI.ChatCompletionMessageParam[]
): Promise<T | null> {
  const model = Models[modelKey]
  const openAi = new OpenAI({
    apiKey: model.apiKey,
    baseURL: model.endpoint,
  })

  const usingTextResp = modelKey.match(/doubao/)
  try {
    const response = await openAi.chat.completions.create({
      model: model.key,
      messages,
      response_format: { type: usingTextResp ? "text" : "json_object" },
      
    })
    const resp = response.choices[0].message.content
    if (!resp) {
      throw new Error("No response from OpenAI")
    }
    if (usingTextResp) {
      const json = extractContent(resp)
      return json as T
    }

    return JSON.parse(resp) as T
  } catch (error) {
    console.error("Error fetching meaning:", error)
    return null
  }
}

export async function getTextAnswerFromOpenAI<T>(
  modelKey: keyof typeof Models,
  messages: OpenAI.ChatCompletionMessageParam[]
): Promise<string | null> {
  const model = Models[modelKey]
  const openAi = new OpenAI({
    apiKey: model.apiKey,
    baseURL: model.endpoint,
  })

  try {
    const response = await openAi.chat.completions.create({
      model: model.key,
      messages,
      response_format: { type: "text" },
    })
    const resp = response.choices[0].message.content

    return resp
  } catch (error) {
    console.error("Error fetching meaning:", error)
    return null
  }
}
