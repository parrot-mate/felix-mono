import { atom } from "jotai"
import { atomFamily } from "jotai/utils"
import { myBooksAtom } from "./myBooksAtom"
import { ReaderDB } from "@pmate/sdk"

export const bookModifyTitleAtom = atom(
  null,
  async (
    _,
    set,
    {
      id,
      title,
    }: {
      id: string
      title: string
    }
  ) => {
    const book = await ReaderDB.BooksDB.get(id)
    if (book.isJust()) {
      book.map((x) => {
        if (x.title?.en) {
          x.title.en = title
        }
        return x
      })
      await ReaderDB.BooksDB.save(id, book)
    }
    set(myBooksAtom)
  }
)
