import { atom } from "jotai"
import { atomFamily } from "jotai/utils"

export type WebsocketStatus = "connected" | "connecting" | "error"

export const websocketStatusAtom = atomFamily(
  (_endpoint: { h3: string; ws: string }) =>
    atom<WebsocketStatus>("connecting"),
  (a, b) => a.h3 === b.h3 && a.ws === b.ws
)
