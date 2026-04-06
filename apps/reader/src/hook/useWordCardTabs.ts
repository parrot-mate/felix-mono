import { tearModeAnalyzeAtom } from "@/atom/reading/tearModeAnalyzeAtom"
import { isWordV4, Logger, Maybe } from "@pmate/utils"
import { sentenceTrimEN } from "@pmate/lang"
import { ReadingBook } from "@pmate/meta"
import { atom, useAtom, useSetAtom } from "jotai"
import { createContext } from "react"

export interface WordCardTab {
  selection: string
  sentence: string
  paragraph: string
  book: Maybe<ReadingBook>
  pid?: number
}

interface TabsState {
  tabs: WordCardTab[]
  activeIndex: number
  showTabs: boolean
}

// Define atoms
const tabsStateAtom = atom<TabsState>({
  tabs: [],
  activeIndex: 0,
  showTabs: false,
})
export const clearTabsAtom = atom(null, (_get, set) => {
  set(tabsStateAtom, { tabs: [], activeIndex: 0, showTabs: false })
})

export const useAddTab = () => {
  const setState = useSetAtom(tabsStateAtom)
  const setTearMode = useSetAtom(tearModeAnalyzeAtom)
  const addTab = (
    word: string,
    sentence: string,
    paragraph: string,
    book: Maybe<ReadingBook>,
    pid?: number
  ) => {
    logger.log("addTab", { word, sentence, paragraph, book, pid })
    word = sentenceTrimEN(word)
    if (!isWordV4(word)) {
      return
    }

    setState((prev) => {
      const tabs = prev.tabs.filter(
        (x) => x.selection.toLowerCase() !== word.toLowerCase()
      )
      tabs.unshift({ selection: word, sentence, paragraph, book, pid })

      return {
        ...prev,
        tabs,
        showTabs: true,
        activeIndex: 0,
      }
    })
    setTearMode("word")
  }
  return addTab
}
const logger = Logger.getDebugger("useWordCardTabs")

export const useWordCardTabs = () => {
  const [state, setState] = useAtom(tabsStateAtom)

  const removeTab = (index: number) => {
    setState((prev) => {
      const nextIndex =
        index > prev.activeIndex
          ? prev.activeIndex
          : Math.max(0, prev.activeIndex - 1)
      return {
        ...prev,
        tabs: prev.tabs.filter((_, i) => i !== index),
        activeIndex: nextIndex,
        showTabs: prev.tabs.length > 1,
      }
    })
  }

  const setActive = (index: number) => {
    setState((prev) => ({
      ...prev,
      activeIndex: index,
    }))
  }

  const clearTabs = () => {
    setState({ tabs: [], activeIndex: 0, showTabs: false })
  }

  return {
    tabs: state.tabs,
    removeTab,
    setActive,
    activeIndex: state.activeIndex,
    clearTabs,
    showTabs: state.showTabs,
    setShowTabs: (show: boolean) => {
      console.log("call setShowTabs")
      setState((prev) => ({
        ...prev,
        tabs: [],
        showTabs: show,
      }))
    },
  }
}

export const WordCardTabContext = createContext<ReturnType<
  typeof useWordCardTabs
> | null>(null)
