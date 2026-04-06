import OpenAI from "openai"
import { env } from "./env"

export type GeminiClient = {
  models: {
    generateContent(args: {
      model: string
      contents: string
      config: { systemInstruction: string }
    }): Promise<{ text?: string }>
  }
}

export class Providers {
  private static _openai: OpenAI | null | undefined
  private static _geminiPromise: Promise<GeminiClient | null> | undefined

  static get openai() {
    if (Providers._openai !== undefined) {
      return Providers._openai
    }
    Providers._openai = env.OPENAI_API_KEY
      ? new OpenAI({
          apiKey: env.OPENAI_API_KEY,
          ...(env.OPENAI_BASE_URL ? { baseURL: env.OPENAI_BASE_URL } : {}),
        })
      : null
    return Providers._openai
  }

  static get gemini() {
    if (Providers._geminiPromise) {
      return Providers._geminiPromise
    }
    if (!env.GEMINI_API_KEY) {
      Providers._geminiPromise = Promise.resolve(null)
      return Providers._geminiPromise
    }
    Providers._geminiPromise = import("@google/genai").then(
      ({ GoogleGenAI }) =>
        new GoogleGenAI({
          apiKey: env.GEMINI_API_KEY,
          apiVersion: "v1beta",
          httpOptions: env.GEMINI_BASE_URL
            ? {
                baseUrl: env.GEMINI_BASE_URL,
              }
            : undefined,
        }) as GeminiClient,
    )
    return Providers._geminiPromise
  }
}
