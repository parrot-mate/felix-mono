import { useAtomValue } from "jotai"
import { wordAtom } from "@/atom/wordAtom"
import { LangShort } from "@pmate/meta"

export const useWord = (word: string, lang: LangShort) => {
  const data = useAtomValue(wordAtom({ word, lang }))
  return data
}
