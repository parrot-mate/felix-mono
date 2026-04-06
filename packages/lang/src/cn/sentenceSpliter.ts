export function splitSentence(paragraph: string): string[] {
  const sentences: string[] = []
  const regex = /“[\s\S]+?”|[^。！？\s][^。！？]*[。！？]?/g

  const matches = paragraph.match(regex)

  if (matches) {
    matches.forEach((sentence) => {
      const trimmed = sentence.trim()
      if (trimmed) {
        sentences.push(trimmed)
      }
    })
  }

  return sentences
}
