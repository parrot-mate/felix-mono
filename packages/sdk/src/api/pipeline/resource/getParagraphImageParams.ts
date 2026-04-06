import { AIGENGAP, type AIImgRequest, AIImgType, type ReadingBook } from "@pmate/meta"
import { aiGenParagraphStr } from "./aiGenParagraphStr"

export const getParagraphImageParams = (book: ReadingBook, pid: number) => {
  const imgPid = Math.max(0, Math.floor(pid / AIGENGAP) * AIGENGAP)
  const req: AIImgRequest<AIImgType.ParagraphIllustrate> = {
    type: AIImgType.ParagraphIllustrate,
    params: {
      paragraph: book.paragraphs[imgPid].content,
      context: aiGenParagraphStr(book, imgPid),
      title: book.title,
      author: book.author,
    },
  }
  return req
}
