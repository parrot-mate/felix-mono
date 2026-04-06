import { getUserLang } from "@/resource/getUserLang"
import { AudioPlayers, AudioPlayerSettings } from "@pmate/sdk"
import { isWordV4, Logger } from "@pmate/utils"
import {
  AudioTaskInit,
  OfflineCacheType,
  ReadingBook,
  Voice,
} from "@pmate/meta"
import {
  aiGenImage as fetchAIImage,
  aiGenTTSAudio as fetchTTSAudio,
  aiGenWord as fetchWord,
  getParagraphExplainParams,
  getParagraphImageParams,
  isResourceExists,
  prepareSentenceExplain,
} from "@pmate/sdk"

type DownloadTask = {
  type: OfflineCacheType
  params: any
}
const logger = Logger.getDebugger("Downloader")
export const getDownloadTasks = async (
  book: ReadingBook,
  start: number,
  take: number,
  bookPlaySettings: {
    voice: Voice
    instructions: string
  }
) => {
  const paragraphs = book.paragraphs.slice(start, start + take)
  const tasks: DownloadTask[] = []
  for (const paragraph of paragraphs) {
    logger.log("p", paragraph)
    const words = paragraph.words.filter((word) => isWordV4(word))
    const userLang = await getUserLang()
    const explainParams = getParagraphExplainParams(paragraph, book, userLang)

    const existsWords = await Promise.all(
      words.map((word) =>
        isResourceExists(OfflineCacheType.Word, {
          word,
          lang: book.lang || "en",
          userLang,
        })
      )
    )
    logger.log("existsWords", existsWords)
    for (let i = 0; i < existsWords.length; i++) {
      const word = words[i]
      const exists = existsWords[i]
      if (!exists) {
        tasks.push({
          type: OfflineCacheType.Word,
          params: { word, lang: book.lang || "en", userLang },
        })
      }
    }

    // Sentence Explains
    const existsExplains = await Promise.all(
      explainParams.map((param) =>
        isResourceExists(OfflineCacheType.SentenceAnalyze, param)
      )
    )

    for (let i = 0; i < existsExplains.length; i++) {
      const param = explainParams[i]
      const exists = existsExplains[i]
      if (!exists) {
        tasks.push({
          type: OfflineCacheType.SentenceAnalyze,
          params: param,
        })
      }
    }

    // Images
    const paragraphImageReq = getParagraphImageParams(book, paragraph.index)
    const existsParagraphImage = await isResourceExists(
      OfflineCacheType.Image,
      paragraphImageReq
    )
    if (!existsParagraphImage) {
      tasks.push({
        type: OfflineCacheType.Image,
        params: paragraphImageReq,
      })
    }

    // Words Sound
    const wordPlaySettings = AudioPlayerSettings[AudioPlayers.WordPlayer]

    const wordsTTSReq = []
    for (const word of words) {
      const voice = wordPlaySettings.defaultVoice
      const params: AudioTaskInit = {
        voice: voice.key,
        text: word,
        lang: "en",
        instructions: "",
        timePoints: false,
      }
      wordsTTSReq.push(params)
    }
    const existsWordsTTS = await Promise.all(
      wordsTTSReq.map((param) =>
        isResourceExists(OfflineCacheType.Audio, param)
      )
    )
    logger.log("tts", existsWordsTTS)
    for (let i = 0; i < existsWordsTTS.length; i++) {
      const param = wordsTTSReq[i]
      const exists = existsWordsTTS[i]
      if (!exists) {
        tasks.push({
          type: OfflineCacheType.Audio,
          params: param,
        })
      }
    }

    // Paragraph Sound
    const paragraphTTSTask: AudioTaskInit = {
      voice: bookPlaySettings.voice.key,
      text: paragraph.content,
      lang: "en",
      instructions: bookPlaySettings.instructions,
      timePoints: true,
    }
    const existsParagraphTTS = await isResourceExists(
      OfflineCacheType.Audio,
      paragraphTTSTask
    )
    if (!existsParagraphTTS) {
      tasks.push({
        type: OfflineCacheType.Audio,
        params: paragraphTTSTask,
      })
    }
  }
  return tasks
}

export const downloadTask = async (task: DownloadTask) => {
  const { type, params } = task
  const exists = await isResourceExists(type, params)
  if (exists) {
    return
  }
  switch (type) {
    case OfflineCacheType.Word:
      return await fetchWord(params)
    case OfflineCacheType.SentenceAnalyze:
      return await prepareSentenceExplain(params)
    case OfflineCacheType.Image:
      return await fetchAIImage(params)
    case OfflineCacheType.Audio:
      return await fetchTTSAudio(params)
    default:
      break
  }
}
