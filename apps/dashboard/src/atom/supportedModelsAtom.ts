import { appendCacheBuster } from "@/util/cacheBusting"
import { Api } from "@pmate/sdk"
import { Model } from "@pmate/meta"
import { atom } from "jotai"

const STATIC_URL = (
  process.env.VITE_PUBLIC_RESOURCE_URL ?? "https://book.skedo.cn"
).replace(/\/+$/, "")

export const supportedModelsAtom = atom(async () => {
  const result = await Api.getFile<Model[]>(
    appendCacheBuster(`${STATIC_URL}/prompts/models.json`)
  )
  return result ?? ([] as Model[])
})
