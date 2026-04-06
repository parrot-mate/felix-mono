import { lru } from "@pmate/utils"
import { Prompt } from "@pmate/meta"
import { Api } from "@sdk/api/Api"

const STATIC_URL = (
  process.env.VITE_PUBLIC_RESOURCE_URL ?? "https://book.skedo.cn"
).replace(/\/+$/, "")

const fetchDefaultConfig = async () => {
  const json = await Api.getFile<Prompt[]>(
    `${STATIC_URL}/prompts/default.json?t=${Date.now()}`
  )
  return json ?? ([] as Prompt[])
}

export const getDefaultPrompt = lru(
  async (key: string) => {
    const defaultConfig = await fetchDefaultConfig()
    const prompt = defaultConfig.find((item) => item.key === key)
    return prompt!
  },
  {
    ttl: 1000 * 60 * 60,
    key: (key) => key,
  }
)
