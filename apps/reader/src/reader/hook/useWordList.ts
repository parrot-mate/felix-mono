import { getLangReadingSetting, isReadable } from "@pmate/lang"
import { WordMarkMeta } from "@pmate/meta"
import { profileAtom } from "@pmate/account-sdk"
import { vocabularyMapAtom } from "@pmate/sdk"
import { useAtomValue } from "jotai"
import { useCallback, useEffect, useMemo, useState } from "react"
import { getWordList } from "../utils/getWordList"

export const useWordList = (sentences: string[], lang = "en") => {
  const profile = useAtomValue(profileAtom)
  const userId = profile?.id ?? ""
  const vocabularyMap = useAtomValue(vocabularyMapAtom(userId))
  const wordSpliter = useMemo(() => {
    return getLangReadingSetting(lang as any).wordSpliter
  }, [lang])

  const getList = useCallback(() => {
    const wordCountMap: Record<string, number> = {}

    const list = sentences.reduce((acc, sentence) => {
      const words = getWordList(sentence, vocabularyMap, wordSpliter)
      return acc.concat(words)
    }, [] as WordMarkMeta[])

    list.forEach((item) => {
      if (isReadable(item.word)) {
        const key = item.word.toLowerCase().replace(/['‘’]/g, "")
        wordCountMap[key] = (wordCountMap[key] || 0) + 1
        item.markId = `${key}#${wordCountMap[key]}`
      }
    })

    return list
  }, [sentences, vocabularyMap, wordSpliter])

  const [wordList, setWordList] = useState(getList)

  useEffect(() => {
    const sub = vocabularyMap.on("change", () => {
      setWordList(getList())
    })
    return sub
  }, [vocabularyMap, getList])

  return wordList
}
