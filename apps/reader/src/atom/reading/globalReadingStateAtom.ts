import { atomFamily } from "jotai/utils"
import { isEqual } from "lodash"
import { GlobalReaderState, PageMode, ReaderState } from "@pmate/meta"
import { createLocalSettingsAtom } from "../storage/createLocalSettingsAtom"
import { atom } from "jotai"

export interface PagingParams {
  mode: PageMode
  bookId: string
}

export const globalReadingStateAtom =
  createLocalSettingsAtom<GlobalReaderState>("globalReadingState", {
    pid: 0,
    id: "",
  })
