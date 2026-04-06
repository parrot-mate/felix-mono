import { Logger } from "@pmate/utils"
import {
  OfflineCacheType,
  VoiceList,
  type AudioTaskInit,
  type AudioTimepoints,
} from "@pmate/meta"
import { Api } from "@sdk/api/Api"
import { Resource } from "@sdk/api/Resource"
import { apiTTS } from "@sdk/api/pipeline/apiTTS"
import { loadUrlAsBase64 } from "@sdk/util/loadUrlAsBase64"
import { withOffline } from "@sdk/util/offlineUtils"

const logger = Logger.getDebugger("asr")
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
        `Attempt ${attempt} failed to load audio. Retrying in ${delayMs} ms...`
      )
      await new Promise((res) => setTimeout(res, delayMs))
    }
  }
  throw new Error(`Failed to load audio after ${retries} attempts: ${url}`)
}

export const aiGenTTSAudio = withOffline(
  OfflineCacheType.Audio,
  async (task: AudioTaskInit) => {
    const voice = VoiceList[task.voice as keyof typeof VoiceList]
    if (!voice) {
      throw new Error(`Voice not found: ${task.voice}`)
    }

    logger.log("aiGenTTSAudio - 1")
    const link = (
      await Resource.apiResourceUrlTts(
        voice.provider,
        voice.name,
        task.text,
        task.instructions || "",
        task.lang || "en",
        task.timePoints || false
      )
    ).unwrapOr(null)
    if (!link) {
      logger.error("aiGenTTSAudio - fail to get link")
      throw new Error("Failed to get TTS link")
    }
    logger.log("aiGenTTSAudio - 2", link)

    const exists = false // !!link && (await checkLinkExists(link))
    if (!exists) {
      logger.log("gen tts", task)
      await apiTTS(
        voice.name,
        voice.provider,
        task.text,
        task.lang || "en",
        task.instructions || "",
        Boolean(task.timePoints || false)
      )
    }
    const base64 = await ensureBase64Loaded(link)
    if (task.timePoints) {
      const timePoints = await fetchTimePoints(task)
      return {
        audio: base64,
        timePoints,
      }
    }
    return {
      audio: base64,
      timePoints: undefined,
    }
  }
)

const fetchTimePoints = async (task: AudioTaskInit) => {
  const voice = VoiceList[task.voice as keyof typeof VoiceList]
  const link = await Resource.apiResourceUrlTtsTimepoints(
    voice!.provider,
    voice!.name,
    task.text,
    task.instructions || "",
    task.lang || "en",
    task.timePoints || false
  )
  const url = link.unwrapOr(null)
  if (!url) {
    return undefined
  }
  const resp = await Api.getFile<AudioTimepoints>(url)
  const timePoints = resp ?? undefined
  const sanitize = (w: string) =>
    w.replace(/^[^A-Za-z0-9À-ÿ'-]+|[^A-Za-z0-9À-ÿ'-]+$/g, "")

  const timePoints1 = timePoints?.map((tp) => {
    const [, index] = tp.wordIndex.split("#")
    const word = sanitize(tp.word || "")
    tp.word = word
    tp.wordIndex = `${word}#${index}`
    return tp
  })
  return timePoints1
}
