import { atomFamily } from "jotai/utils"
import { PageMode, ReaderState } from "@pmate/meta"
import { atom } from "jotai"
import { Emitter, Logger, Maybe } from "@pmate/utils"
import { myBooksAtom } from "../myBooksAtom"
import { ReaderDB } from "@pmate/sdk"

export interface PagingParams {
  mode: PageMode
  bookId: string
}

const logger = Logger.getDebugger("readerStateAtom")
const keyOf = (id: string) => `readingPosition@${id}`
class ReaderStateMgr extends Emitter<string> {
  lastPageNo?: number
  pid: number = 0

  constructor(
    private id: string,
    private pageNo: number,
    private mode: PageMode
  ) {
    super()
  }
  private static async load(id: string) {
    const data = (await ReaderDB.UserLocalSettings.get(
      keyOf(id)
    )) as Maybe<ReaderState>
    const s = new ReaderStateMgr(id, 0, "punch")
    if (data.isNothing()) {
      return s
    }
    data.map((data: ReaderState) => {
      s.pid = data.pid
      s.mode = data.mode
    })
    return s
  }

  public async updatePage(pageNo: number) {
    if (this.pageNo === pageNo) {
      this.pageNo = pageNo
      const savedValue: ReaderState = {
        pid: this.pid,
        mode: this.mode,
      }
      await ReaderDB.UserLocalSettings.save(keyOf(this.id), savedValue)
    } else {
      this.pageNo = pageNo
      const savedValue: ReaderState = {
        pid: this.pid,
        mode: this.mode,
      }
      await ReaderDB.UserLocalSettings.save(keyOf(this.id), savedValue)
    }
  }

  public async update(values: Partial<ReaderState>) {
    if (values.pid !== undefined) {
      if (values.pid !== this.pid) {
        this.emit("pid", values.pid)
        this.pid = values.pid
      }
    }
    if (values.mode !== undefined) {
      this.mode = values.mode
    }

    const savedValue: ReaderState = {
      pid: this.pid,
      mode: this.mode,
    }

    logger.log("save", savedValue)
    await ReaderDB.UserLocalSettings.save(keyOf(this.id), savedValue)
  }

  public getState(): ReaderState {
    return {
      pid: this.pid,
      mode: this.mode,
    }
  }

  static cache: Map<string, ReaderStateMgr> = new Map()

  static async get(id: string) {
    if (!ReaderStateMgr.cache.has(id)) {
      const obj = await ReaderStateMgr.load(id)
      ReaderStateMgr.cache.set(id, obj)
    }
    return ReaderStateMgr.cache.get(id)!
  }
}
export const readerStateAtom = atomFamily((id: string) => {
  return atom(async () => {
    return await ReaderStateMgr.get(id)
  })
})

export const allBooksReadingStateAtom = atom(async (get) => {
  const books = await get(myBooksAtom)
  return books.mapAsync(async (books) => {
    const list = []
    for (let book of books) {
      const state = await ReaderStateMgr.get(book.id)
      list.push({
        state,
        book,
      })
    }
    return list
  })
})
