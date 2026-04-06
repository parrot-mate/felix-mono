import { atom } from "jotai"
import { atomFamily } from "jotai/utils"
// @ts-ignore
import { aiGenWord as fetchWord } from "@pmate/sdk"
import { getUserLang } from "@/resource/getUserLang"
import type { LangShort } from "@pmate/meta"
import { SimpleWord } from "@pmate/meta"
import { isEqual } from "lodash"

export const wordResourceAtom = atomFamily(
  (param: { word: string; lang: LangShort }) =>
    atom(async () => {
      const userLang = await getUserLang()
      return fetchWord({ ...param, userLang })
    }),
  isEqual
)

export const wordAtom = atomFamily(
  (param: { word: string; lang: LangShort }) =>
    atom(async (get) => {
      const word = param.word.toLowerCase()
      const simpleWord: SimpleWord | null = await get(
        wordResourceAtom({ word, lang: param.lang })
      )
      return simpleWord
    }),
  isEqual
)
