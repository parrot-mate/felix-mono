import { VocabularyMap } from "@pmate/utils"
import { isReadable } from "@pmate/lang"
import { Vocabulary, WordMarkMeta } from "@pmate/meta"

export function getWordList(
  text: string,
  map: VocabularyMap<Vocabulary>,
  wordSpliter: (s: string) => string[]
) {
  const prts = wordSpliter(text)
  const list: WordMarkMeta[] = []

  let pos = 0
  for (let i = 0; i < prts.length; i++) {
    const prt = prts[i]
    list.push({
      word: prt,
      startPosition: pos,
      inVocabulary: Boolean(map.search(prt)),
      readable: isReadable(prt),
      markId: "",
    })
    pos += prt.length
  }

  return list
}
