import { userSettingsAtom } from "@pmate/account-sdk"
import { bookAtom } from "@pmate/sdk"
import { WordCard } from "@/component/WordCard"
import { useBook } from "@pmate/sdk"
import { explainTabsAtom } from "@/reader/atom/explainTabsAtom"
import { Spinner } from "@pmate/uikit"
import { useAtomValue } from "jotai"
import { Suspense } from "react"
import { SentenceExplainDrawer } from "../SentenceExplainDrawer"
import { getParagraphExplainParams } from "@pmate/sdk"

export const ExplainTabs = () => {
  const data = useAtomValue(explainTabsAtom)
  const bookId = useBook()
  const book = useAtomValue(bookAtom(bookId)).unwrap()
  const lang = useAtomValue(userSettingsAtom("uiLang"))

  const params = data
    ? getParagraphExplainParams(data.paragraph, book, lang)
    : []

  if (!data) {
    return null
  }
  const { word, sentence, paragraph, show } = data

  return (
    <div className="flex flex-col z-[2]">
      {show === "word" && (
        <div className="flex-1 h-full">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-6">
                <Spinner />
              </div>
            }
          >
            <WordCard
              isActive={true}
              wordStr={word.word}
              key={word.word}
              paragraph={paragraph.content}
              explainParams={params}
              sentence={sentence}
              pid={paragraph.index}
            />
          </Suspense>
        </div>
      )}
      {show === "explain" && (
        <div className="flex-1">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-6">
                <Spinner />
              </div>
            }
          >
            <SentenceExplainDrawer mode="fixed" />
          </Suspense>
        </div>
      )}
    </div>
  )
}
