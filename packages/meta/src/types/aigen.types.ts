import type { LangShort } from "./lang.types"

export enum AIImgType {
  WordExplain = "WordExplain",
  ParagraphIllustrate = "ParagraphIllustrate",
  BookCover = "BookCover",
}

export type AIImgParams = {
  [AIImgType.WordExplain]: {
    word: string
  }
  [AIImgType.ParagraphIllustrate]: {
    title: string
    paragraph: string
    context: string
    author: string
  }
  [AIImgType.BookCover]: {
    title: string
  }
}

export type AIImgRequest<T extends AIImgType> = {
  type: T
  params: AIImgParams[T]
}

export interface AudioTaskInit {
  voice?: string
  text: string
  lang?: LangShort
  instructions?: string
  timePoints?: boolean
  group?: string
  translation?: {
    from: LangShort
    to: LangShort
    accuracy: "rough" | "accurate"
    context?: string
  }
}
