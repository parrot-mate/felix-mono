import { CompanionProfiles, Voice, VoiceList } from "@pmate/meta"
import { atom } from "jotai"
import { atomFamily } from "jotai/utils"
import {
  AudioPlayer,
  AudioPlayerSettings,
  AudioPlayers,
} from "@sdk/util/audio"
import { userSettingsAtom } from "./userSettingsAtom"

export const playersVoiceSettingsAtom = atomFamily(
  (player: AudioPlayers) => {
    return atom(async (get) => {
      if (player === AudioPlayers.WordPlayer) {
        return AudioPlayerSettings[AudioPlayers.WordPlayer].defaultVoice
      }
      if (player === AudioPlayers.BookPlayer) {
        const companionName = await get(userSettingsAtom("companion"))
        const companion = CompanionProfiles.find(
          (c) => c.name === companionName
        )
        return companion?.voice ?? VoiceList.OPEN_AI_Alloy
      }
      return undefined as Voice | undefined
    })
  }
)

export const audioPlayerAtom = atomFamily((playerType: AudioPlayers) => {
  return atom(async (get) => {
    const voice = await get(playersVoiceSettingsAtom(playerType))
    const playSpeed = await get(userSettingsAtom("playSpeed"))
    return new AudioPlayer(playerType, playSpeed, voice)
  })
})