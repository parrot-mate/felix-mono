import { atomFamily } from "jotai/utils"
import { atom } from "jotai"
import { readingPickUpAtom } from "./readingPickUpAtom"
import { Logger } from "@pmate/utils"
import { atomAsync } from "@/util/atomAsync"

const logger = Logger.getDebugger("reportPickAtom")
export const reportPickAtom = atomFamily((id: string) =>
  atomAsync(null, async (_, set, pid: number, word: string, isNew: boolean) => {
    logger.log("report", { pid, word, isNew })

    await set(
      readingPickUpAtom({
        id,
        pid,
      }),
      (value) => {
        value.push({
          word,
          new: isNew,
        })
        return [...value]
      }
    )
  })
)
