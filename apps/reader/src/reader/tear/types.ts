import { Page, PunchPage, ReadingBook } from "@pmate/meta"

export enum SlideType {
  Paragraph,
}

export type ProgressCheckPoint = {
  page: Page
  book: ReadingBook
}
