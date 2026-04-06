import { type AIImgRequest, type AIImgType, OfflineCacheType } from "@pmate/meta"
import { Api } from "@sdk/api/Api"
import { PipelineWorkerClient } from "@sdk/socket/PipelineWorkerClient"
import { withOffline } from "@sdk/util/offlineUtils"
import { uniqHashForAIImage } from "@pmate/utils"
import { loadUrlAsBase64 } from "@sdk/util/loadUrlAsBase64"

const STATIC_URL = (
  process.env.VITE_PUBLIC_RESOURCE_URL ?? "https://book.skedo.cn"
).replace(/\/+$/, "")

const ensureBase64Loaded = async (
  url: string,
  retries: number = 5,
  delayMs: number = 1000
): Promise<string> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const base64 = await loadUrlAsBase64(url)
      return base64
    } catch (err) {
      console.warn(
        `Attempt ${attempt} failed to load image. Retrying in ${delayMs} ms...`
      )
      await new Promise((res) => setTimeout(res, delayMs))
    }
  }
  throw new Error(`Failed to load image after ${retries} attempts: ${url}`)
}

export const aiGenImage = withOffline(
  OfflineCacheType.Image,
  async (req: AIImgRequest<AIImgType>) => {
    const pipeline = await PipelineWorkerClient.current()
    const hash = uniqHashForAIImage(req)
    const url = `${STATIC_URL}/plus-images/${hash}.webp`
    const exists = await Api.exists(url)
    if (exists) {
      return ensureBase64Loaded(url)
    }
    await pipeline.request("@imgen#1", {
      type: "generate-image",
      params: req,
    })

    const base64 = await ensureBase64Loaded(url)
    return base64
  }
)
