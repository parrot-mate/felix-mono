import { atom, Getter } from "jotai"
import { Endpoints } from "@sdk/config"
import { PipelineWorkerClient } from "@sdk/socket/PipelineWorkerClient"
import { profileAtom } from "@pmate/account-sdk"
import { realtimeClientAtom } from "./realtimeClientAtom"

export const pipelineWorkerAtom = atom<Promise<PipelineWorkerClient>>(
  async (get: Getter) => {
    const profile = await get(profileAtom)
    const userId = profile?.id ?? ""
    const ws = await get(realtimeClientAtom(Endpoints.hub))
    return new PipelineWorkerClient(userId, ws)
  }
)
