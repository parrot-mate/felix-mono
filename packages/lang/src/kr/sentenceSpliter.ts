export function splitSentence(paragraph: string): string[] {
  return paragraph
    .split(/(?<=[.!?。！？])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}
