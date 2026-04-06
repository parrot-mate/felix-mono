import { atom } from "jotai"
import { SlideType } from "../types"

export const currentSlideType = atom<SlideType>(SlideType.Paragraph)
