import { LangShort } from "@pmate/meta"
import { PipelineWorkerClient } from "@sdk/socket/PipelineWorkerClient"

export const apiTTS = async (
  voice: string,
  provider: string,
  text: string,
  lang: LangShort,
  instructions: string,
  timePoints: boolean
) => {
  const client = await PipelineWorkerClient.current()
  await client.request("@tts#1", {
    text,
    voice,
    provider: provider,
    lang,
    instructions,
    timePoints,
  })
}