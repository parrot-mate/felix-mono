import textToSpeech from "@google-cloud/text-to-speech"

import fs from "fs"
import util from "util"
import path from "path"
import { adjustVolume } from "../audio/adjustVolumn"

const credentials = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, "../../../google-accounts.json"),
    "utf-8"
  )
)
const client = new textToSpeech.TextToSpeechClient({
  credentials,
})

export async function googleTTS(text: string, voice: string) {
  if (voice === "google-tts-male") {
    voice = "en-US-Neural2-D"
  }

  const response = await client.synthesizeSpeech({
    input: { text: text },

    voice: { languageCode: "en-US", name: voice },
    audioConfig: {
      audioEncoding: "MP3",
      volumeGainDb: 16,
      pitch: 0,
      speakingRate: 0.7,
    },
  })
  const content = response[0].audioContent
  if (!content) {
    throw new Error("Google TTS: No content in response")
  }
  const buffer = Buffer.from(content)
  const after = await adjustVolume(buffer, 2)

  return after
}
