import { PickUp, ReadingProgress } from "@pmate/meta"
import { atom } from "jotai"
import { atomFamily } from "jotai/utils"
import { isEqual } from "lodash"
import { createLocalSettingsAtom } from "../storage/createLocalSettingsAtom"

export interface ReadingPickupParams {
  id: string
  pid: number
}

export const readingPickUpAtom = atomFamily(
  (params: ReadingPickupParams) => {
    return createLocalSettingsAtom<PickUp[]>(
      `readingPickup@${params.id}-${params.pid}`,
      []
    )
  },
  (a, b) => isEqual(a, b)
)
