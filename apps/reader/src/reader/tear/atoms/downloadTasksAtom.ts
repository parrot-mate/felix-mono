import { AudioPlayers, audioPlayerAtom, bookAtom } from "@pmate/sdk"
import { atom } from "jotai"
import { atomFamily, atomWithRefresh } from "jotai/utils"
import { isEqual } from "lodash"
import { getDownloadTasks } from "../resource/downloader"

type Params = {
  bookId: string
  pid: number
}

export const showDownloadTaskModal = atom(false)

export const downloadTasksAtom = atomFamily((params: Params) => {
  return atomWithRefresh(async (get) => {
    const book = (await get(bookAtom(params.bookId))).unwrap()
    const bookPlayer = await get(audioPlayerAtom(AudioPlayers.BookPlayer))
    const tasks = await getDownloadTasks(book, params.pid, 100, {
      voice: bookPlayer.getVoice()!,
      instructions: "",
    })
    return tasks
  })
}, isEqual)
