import { profileAtom } from "@pmate/account-sdk"
import { appendUserLogAtom, createUserLog } from "@pmate/sdk"
import { LogType, ReadingParagraph } from "@pmate/meta"
import { Logger } from "@pmate/utils"
import { atom } from "jotai"
import { atomFamily } from "jotai/utils"
import { readingPickUpAtom } from "./readingPickUpAtom"

const logger = Logger.getDebugger("readingRecordAtom")
export const readingRecordAtom = atomFamily((id: string) =>
  atom(
    null,
    async (get, set, paragraph: ReadingParagraph, s: number, e: number) => {
      const pid = paragraph.index
      const picked = await get(
        readingPickUpAtom({
          id,
          pid,
        })
      )
      const profile = await get(profileAtom)
      const userId = profile?.id ?? ""
      const log = await createUserLog(
        LogType.Reading,
        {
          book: id,
          pid,
          wc: paragraph.words.length,
          time: [s, e],
          picked: picked.unwrapOr([]).map((x) => x.word),
          uniqWords: [...new Set(paragraph.words)],
        },
        userId
      )
      logger.log("append", log)
      await set(appendUserLogAtom, log)
    }
  )
)
