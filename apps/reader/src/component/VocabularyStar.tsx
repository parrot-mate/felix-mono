import { VocabularyStar as SdkVocabularyStar } from "@pmate/sdk"

export interface VocabularyStarProps {
  word: string
  sentence?: string
}

export const VocabularyStar = ({
  word,
  sentence,
}: VocabularyStarProps) => {
  return (
    <SdkVocabularyStar word={word} sentence={sentence} />
  )
}
