import { type Prompt } from "@pmate/meta"
import { Api } from "@sdk/api"

const STATIC_URL = (
  process.env.VITE_PUBLIC_RESOURCE_URL ?? "https://book.skedo.cn"
).replace(/\/+$/, "")

export const fetchPromptConfig = async (fileName: string) => {
  const json = await Api.getFile<Prompt[]>(
    `${STATIC_URL}/prompts/${fileName}?t=${Date.now()}`
  )
  return json ?? ([] as Prompt[])
}