require("../env")
import { lru } from "@pmate/utils"
import { LangShort, VoiceList } from "@pmate/meta"
import { resourceKeyTTS } from "@pmate/service-utils"
import express from "express"
import OpenAI from "openai"
import { SpeechCreateParams } from "openai/resources/audio/speech.mjs"
import { getJSONAnswerFromOpenAI } from "../runner/openAI"
import { POSS } from "../util/alioss"

const app = express()
const port = 7001
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

app.use(express.json())

// Proxy route to forward requests to OpenAI API
app.post("/tts/openai", async (req, res) => {
  const { text, voice, instructions, lang, timePoints } = req.body
  try {
    console.log("Received request:", req.body)
    const audio = await generateAudio({
      text,
      provider: "openai",
      voice,
      instructions,
      lang,
      timePoints,
    })
    res.send({
      audio,
    })
  } catch (ex) {
    console.error(ex)
    res.status(500).send("Error generating audio")
  }
})

app.post("/completion/json", async (req, res) => {
  const { messages, modelKey } = req.body
  const json = await getJSONAnswerFromOpenAI(modelKey, messages)
  res.status(200).send(
    JSON.stringify({
      data: json,
    })
  )
})

app.post("/tts/upload", async (req, res) => {
  const {
    text,
    voice,
    provider,
    mp3: mp3Base64,
    lang,
    instructions,
    timePoints,
  } = req.body
  const mp3 = Buffer.from(mp3Base64, "base64")
  const key = resourceKeyTTS(
    provider,
    voice,
    text,
    lang,
    instructions,
    timePoints
  )
  try {
    await POSS.publicOSS.uploadFileToOSS(key, mp3)
    res.send("ok")
  } catch (ex) {
    console.error(ex)
    res.status(500).send("Error generating audio")
  }
})

app.post("/tts/timepoints", async (req, res) => {
  const { text, voice, provider, timepoints, lang, instructions } = req.body
  if (!text || !voice || !provider) {
    return res.status(400).send("Missing required parameters")
  }
  const key = resourceKeyTTS(provider, voice, text, lang, instructions, true)

  await POSS.publicOSS.uploadJsonToOSS(
    key.replace(".mp3", ".align.json"),
    timepoints
  )
  res.send("ok")
})

const generateAudio = lru(_generateAudio, {
  ttl: 60_1000,
  key: (options) =>
    JSON.stringify([
      options.text,
      options.voice,
      options.provider,
      options.lang,
      options.instructions,
      options.timePoints,
    ]),
})
const voiceList = Object.values(VoiceList)
async function _generateAudio(options: {
  text: string
  voice: string
  provider: string
  lang: LangShort
  instructions?: string
  timePoints?: boolean
}) {
  const { text, voice, provider, instructions, timePoints } = options
  const resource = resourceKeyTTS(
    provider,
    voice,
    text,
    options.instructions || "",
    options.lang,
    timePoints
  )
  const exists = await POSS.publicOSS.existsOSS(resource)
  if (exists) {
    const buffer = await POSS.publicOSS.getResourceOSS(resource)
  }
  console.log("resource key", resource)

  const genInstructions: string = instructions || ""
  // console.log("genInstructions", {
  //   model: "gpt-4o-mini-tts",
  //   voice: voice as SpeechCreateParams["voice"],
  //   input: text,
  //   response_format: "mp3",
  //   instructions: genInstructions,
  // })
  const response = await openai.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice: voice as SpeechCreateParams["voice"],
    input: text,
    response_format: "mp3",
    instructions: genInstructions,
  })
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  await POSS.publicOSS.uploadFileToOSS(resource, buffer)
  const b64 = buffer.toString("base64")
  return b64
}

app.listen(port, () => {
  console.log(`Proxy server is running on http://localhost:${port}`)
})
