import { atom } from "jotai"
import { atomFamily } from "jotai/utils"
import { isEqual } from "lodash"
import { websocketStatusAtom } from "./websocketStatusAtom"

export const networkUnstableAtom = atomFamily((endpoints: { h3: string; ws: string }[]) => {
  return atom((get) => {
    const statuses = endpoints.map((e) => get(websocketStatusAtom(e)))
    const unstable = statuses.some((s) => s !== "connected")
    return unstable
  })
}, isEqual)
