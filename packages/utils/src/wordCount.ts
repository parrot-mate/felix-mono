import type { ReadingParagraph } from "@pmate/meta"

export function wordCount0(paragraphs: ReadingParagraph[]) {
  let count = 0
  for (let p of paragraphs) {
    count += p.words.length
  }
  return count
}
