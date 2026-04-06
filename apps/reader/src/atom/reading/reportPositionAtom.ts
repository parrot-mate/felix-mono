import { atom } from "jotai"
import { atomFamily } from "jotai/utils"
import { readerStateAtom } from "./readerStateAtom"
import { Logger } from "@pmate/utils"
import { globalReadingStateAtom } from "./globalReadingStateAtom"
import { atomAsync } from "@/util/atomAsync"
const logger = Logger.getDebugger("reportPositionAtom")
export const reportPositionAtom = atomFamily((id: string) =>
  atomAsync(
    null,
    async (
      get,
      set,
      state: {
        pid: number
        title: string
      }
    ) => {
      logger.log("report", { id, state })
      const stateObj = await get(readerStateAtom(id))
      await stateObj.update({
        pid: state.pid,
      })
      set(globalReadingStateAtom, {
        id,
        pid: state.pid,
        title: state.title,
      })
    }
  )
)
