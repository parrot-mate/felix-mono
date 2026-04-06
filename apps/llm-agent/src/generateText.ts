import type { AgentModel } from "@pmate/meta"
import { Providers } from "./providers"

export async function generateText(
  model: AgentModel,
  instructionTemplate: string,
  promptTemplate: string,
  variables: Record<string, unknown>,
) {
  const instructions = renderTemplate(instructionTemplate, variables)
  const input = renderTemplate(promptTemplate, variables)

  if (model.provider === "openai") {
    const openai = Providers.openai
    if (!openai) {
      throw new Error("OPENAI_API_KEY is required for openai models")
    }
    const t0 = Date.now()
    console.log("[llm-agent] openai request start", {
      model: model.version,
    })
    const response = await openai.responses.create({
      model: model.version,
      instructions,
      input,
    })
    console.log("[llm-agent] openai request done", {
      model: model.version,
      elapsedMs: Date.now() - t0,
    })
    return extractResponseText(response)
  }
  if (model.provider === "gemini") {
    const gemini = await Providers.gemini
    if (!gemini) {
      throw new Error("GEMINI_API_KEY is required for gemini models")
    }
    const t0 = Date.now()
    console.log("[llm-agent] gemini request start", {
      model: model.version,
    })
    const response = await gemini.models.generateContent({
      model: model.version,
      contents: input,
      config: {
        systemInstruction: instructions,
      },
    })
    console.log("[llm-agent] gemini request done", {
      model: model.version,
      elapsedMs: Date.now() - t0,
    })
    return response.text || ""
  }
  throw new Error(`Unsupported model provider "${model.provider}" for llm-agent`)
}

function renderTemplate(template: string, variables: Record<string, unknown>) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, rawName: string) => {
    const value = variables[rawName]
    if (value == null) {
      throw new Error(`Missing variable "${rawName}"`)
    }
    if (typeof value === "string") {
      return value
    }
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value)
    }
    return JSON.stringify(value)
  })
}

function extractResponseText(response: any) {
  if (typeof response?.output_text === "string" && response.output_text) {
    return response.output_text
  }
  const output = response?.output
  if (!Array.isArray(output)) {
    return ""
  }
  const chunks: string[] = []
  for (const item of output) {
    const content = item?.content
    if (!Array.isArray(content)) {
      continue
    }
    for (const part of content) {
      if (typeof part?.text === "string") {
        chunks.push(part.text)
      }
    }
  }
  return chunks.join("\n").trim()
}
