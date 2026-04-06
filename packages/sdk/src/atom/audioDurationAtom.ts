import { AudioTaskInit } from "@pmate/meta"
import { atom } from "jotai"
import { atomFamily } from "jotai/utils"
import { isEqual } from "lodash"
import { AudioPlayers } from "@sdk/util/audio"
import { audioPlayerAtom } from "./audioPlayersAtom"

export const audioDurationAtom = atomFamily((params: AudioTaskInit) => {
  return atom(async (get) => {
    const player = await get(audioPlayerAtom(AudioPlayers.ChatPlayer))
    const [task] = await player.createTask(params)
    if (!task) {
      return 0
    }
    const duration = await player.loadDuration(task)
    return duration
  })
}, isEqual)