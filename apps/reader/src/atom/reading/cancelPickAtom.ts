import { atomFamily } from "jotai/utils"
import { atom } from "jotai"
import { readingPickUpAtom } from "./readingPickUpAtom"
import { atomAsync } from "@/util/atomAsync"

export const cancelPickAtom = atomFamily((id: string) =>
  atomAsync(null, async (_, set, pid: number, word: string) => {
    set(
      readingPickUpAtom({
        id,
        pid,
      }),
      (value) => {
        return value.filter((x) => {
          x.word.toLowerCase() !== word.toLowerCase()
        })
      }
    )
  })
)
