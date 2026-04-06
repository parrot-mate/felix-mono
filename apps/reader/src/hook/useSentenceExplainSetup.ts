import { explainTabsAtom } from "@/reader/atom/explainTabsAtom"
import { userSettingsAtom } from "@pmate/account-sdk"
import {
  bookAtom,
  getParagraphExplainParams,
  paragraphExplainParamsToPrompt,
  useBook,
} from "@pmate/sdk"
import { useAtomValue } from "jotai"
import { useMemo } from "react"

export const useSentenceExplainSetup = () => {
  const explainData = useAtomValue(explainTabsAtom)
  const bookId = useBook()
  const book = useAtomValue(bookAtom(bookId)).unwrap()
  const uiLang = useAtomValue(userSettingsAtom("uiLang"))

  const params = useMemo(() => {
    if (!explainData) {
      return []
    }
    return getParagraphExplainParams(explainData.paragraph, book, uiLang)
  }, [book, explainData, uiLang])

  const sentence = explainData?.sentence ?? ""

  const currentParam = useMemo(() => {
    if (!params.length || !sentence) {
      return null
    }

    return (
      params.find((param) => {
        const target = param.sentences[param.index] || ""
        return (
          target.toLowerCase().trim() === sentence.toLocaleLowerCase().trim()
        )
      }) ?? null
    )
  }, [params, sentence])

  const mapped = useMemo(() => {
    if (!currentParam) {
      return null
    }

    return paragraphExplainParamsToPrompt(currentParam, {
      fallbackSentence: sentence,
    })
  }, [currentParam, sentence])

  return {
    promptKey: mapped?.promptKey ?? null,
    sentence,
    variables: mapped?.variables ?? null,
  }
}
