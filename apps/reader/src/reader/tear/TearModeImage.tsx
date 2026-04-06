import { aiImageAtom } from "@/atom/aigen/aiImageAtom"
import { AIGENGAP } from "@pmate/meta"
import {
  AIImgRequest,
  AIImgType,
  ReadingBook,
  ReadingParagraph,
} from "@pmate/meta"
import { Logger, uniqHashForAIImage } from "@pmate/utils"
import { Box } from "@mui/material"
import { useAtomValue } from "jotai"
import { useState } from "react"
import { aiGenParagraphStr } from "@pmate/sdk"
import { getParagraphImageParams } from "@pmate/sdk"

interface Params {
  paragraph: ReadingParagraph
  book: ReadingBook
}

const logger = Logger.getDebugger("TearModeImage")

const imageRequests = (paragraph: ReadingParagraph, book: ReadingBook) => {
  const start = paragraph.index - (paragraph.index % AIGENGAP)
  const indices = [start, start - AIGENGAP, start - AIGENGAP * 2].filter(
    (idx) => idx >= 0
  )

  const requests = indices.map((idx) => {
    const req: AIImgRequest<AIImgType.ParagraphIllustrate> = {
      type: AIImgType.ParagraphIllustrate,
      params: {
        title: book.title,
        author: book.author,
        paragraph: book.paragraphs[idx].content,
        context: aiGenParagraphStr(book, idx),
      },
    }
    const hash = uniqHashForAIImage(req)
    return `https://book.skedo.cn/plus-images/${hash}.webp`
  })

  const coverParams: AIImgRequest<AIImgType.BookCover> = {
    type: AIImgType.BookCover,
    params: { title: book.title },
  }

  const hashCover = uniqHashForAIImage(coverParams)
  requests.push(`https://book.skedo.cn/plus-images/${hashCover}.webp`)

  return requests
}

export const TearModeImage = ({ paragraph, book }: Params) => {
  return <IllustrateImage paragraph={paragraph} book={book} />
}

const IllustrateImage = ({ paragraph, book }: Params) => {
  const [bgUrl, setBgUrl] = useState<string | undefined>(undefined)

  const checkImageExists = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve(true)
      img.onerror = () => resolve(false)
      img.src = url
    })
  }

  const coverParams: AIImgRequest<AIImgType.BookCover> = {
    type: AIImgType.BookCover,
    params: { title: book.title },
  }
  const req = getParagraphImageParams(book, paragraph.index)
  const fallbackReq = getParagraphImageParams(book, paragraph.index - AIGENGAP)
  const url = useAtomValue(aiImageAtom(req)).unwrapOr(undefined)
  const coverUrl = useAtomValue(aiImageAtom(coverParams)).unwrapOr(undefined)
  const fallbackUrl = useAtomValue(aiImageAtom(fallbackReq)).unwrapOr(undefined)
  const img = url || fallbackUrl || coverUrl
  if (!img) {
    return null
  }

  return (
    <Box
      className="tear-mode-image"
      sx={{
        position: "absolute",
        backgroundImage: img ? `url(${img})` : undefined,
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundSize: "cover",
        backgroundPosition: "center",
        zIndex: 0,
      }}
    />
  )
}
