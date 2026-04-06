require("../env")
import { Prompt } from "@pmate/meta"
import cors from "cors"
import express, { json } from "express"
import { asyncHandler, errorHandler } from "../errorHandler"
import "../globalerror"
import { POSS } from "../util/alioss"

const app = express()

const normalizePromptKey = (value: string) => {
  if (typeof value !== "string") {
    throw new Error("prompt key must be a string")
  }
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error("prompt key is required")
  }
  const normalized = trimmed.replace(/^\/+/, "")
  if (normalized.includes("..")) {
    throw new Error("invalid prompt key")
  }
  return normalized
}

app.use(
  cors({
    preflightContinue: false,
    maxAge: 86400,
  })
)

app.put(
  "/prompt-config",
  json(),
  asyncHandler(async (body: { prompts?: Prompt[] }) => {
    if (!Array.isArray(body.prompts)) {
      throw new Error("prompts payload is required")
    }

    await POSS.publicOSS.uploadJsonToOSS(`/prompts/update.json`, body.prompts)
    return "ok"
  })
)

app.put(
  "/prompt",
  json(),
  asyncHandler(async (body: { prompt?: Prompt }) => {
    const prompt = body.prompt
    if (!prompt || typeof prompt.key !== "string" || prompt.key.trim() === "") {
      throw new Error("prompt payload with valid key is required")
    }

    const normalizedKey = normalizePromptKey(prompt.key)
    const filePath = `/prompts/${normalizedKey}.json`
    const existingPrompt = await POSS.publicOSS.getResourceOSS<Prompt>(filePath)
    const previousVersion = existingPrompt?.version ?? 0
    const nextVersion = previousVersion + 1

    if (existingPrompt) {
      const archivePath = `/prompts/${normalizedKey}-${previousVersion}.json`
      await POSS.publicOSS.uploadJsonToOSS(archivePath, existingPrompt)
    }

    await POSS.publicOSS.uploadJsonToOSS(filePath, {
      ...prompt,
      version: nextVersion,
    })
    return { version: nextVersion }
  })
)

app.post(
  "/prompt",
  json(),
  asyncHandler(
    async (body: { key?: string; template?: Partial<Prompt> | null }) => {
      const incomingKey = body?.key ?? body?.template?.key ?? ""
      const normalizedKey = normalizePromptKey(incomingKey)

      const listPath = `/prompts/list.json`
      const promptPath = `/prompts/${normalizedKey}.json`

      const existingKeys =
        (await POSS.publicOSS.getResourceOSS<string[]>(listPath)) ?? []

      if (existingKeys.includes(normalizedKey)) {
        throw new Error("prompt key already exists")
      }

      const promptFileExists = await POSS.publicOSS.existsOSS(promptPath)
      if (promptFileExists) {
        throw new Error("prompt file already exists")
      }

      const template = body?.template ?? {}
      const payload: Prompt = {
        key: normalizedKey,
        title: template.title ?? normalizedKey,
        model: template.model ?? "",
        messages: Array.isArray(template.messages)
          ? template.messages
          : [],
        variables: Array.isArray(template.variables)
          ? template.variables
          : [],
        resultType: template.resultType ?? "json",
        caching: Boolean(template.caching),
        version:
          typeof template.version === "number" && template.version > 0
            ? template.version
            : 1,
      }

      await POSS.publicOSS.uploadJsonToOSS(promptPath, payload)

      existingKeys.push(normalizedKey)
      existingKeys.sort((a, b) => a.localeCompare(b))
      await POSS.publicOSS.uploadJsonToOSS(listPath, existingKeys)

      return { prompt: payload }
    }
  )
)

app.post(
  "/prompt/modify-key",
  json(),
  asyncHandler(async (body: { oldKey?: string; newKey?: string }) => {
    const { oldKey, newKey } = body ?? {}
    if (!oldKey || !newKey) {
      throw new Error("oldKey and newKey are required")
    }

    const sourceKey = normalizePromptKey(oldKey)
    const targetKey = normalizePromptKey(newKey)

    if (sourceKey === targetKey) {
      throw new Error("new key must be different from the old key")
    }

    const sourcePath = `/prompts/${sourceKey}.json`
    const targetPath = `/prompts/${targetKey}.json`

    const sourcePrompt = await POSS.publicOSS.getResourceOSS<Prompt>(sourcePath)
    if (!sourcePrompt) {
      throw new Error("source prompt does not exist")
    }

    // const targetExists = await POSS.publicOSS.existsOSS(targetPath)
    // if (targetExists) {
    //   throw new Error("target prompt key already exists")
    // }

    const nextPrompt: Prompt = {
      ...sourcePrompt,
      key: targetKey,
      version: 0,
    }

    await POSS.publicOSS.uploadJsonToOSS(targetPath, nextPrompt)

    const listPath = `/prompts/list.json`
    const promptKeys =
      (await POSS.publicOSS.getResourceOSS<string[]>(listPath)) ?? []
    if (!promptKeys.includes(targetKey)) {
      promptKeys.push(targetKey)
      promptKeys.sort((a, b) => a.localeCompare(b))
    }
    await POSS.publicOSS.uploadJsonToOSS(listPath, promptKeys)

    return { key: targetKey, version: nextPrompt.version }
  })
)

app.get("/", (_req, res) => {
  res.json({ message: "ok" })
})

app.use(errorHandler)

const PORT = process.env.CMS_SERVICE_PORT || process.env.PORT || 9105
app.listen(PORT, () => {
  console.log(`Admin service listening on port ${PORT}`)
})
